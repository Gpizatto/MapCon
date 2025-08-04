import React, { useEffect, useState } from 'react';
import { DivOverlay, geoJSON, latLng, LayerGroup } from 'leaflet'; 
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMapEvent, useMapEvents, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css';
import { icon } from "leaflet"
import { useForm, Controller, reset, get } from 'react-hook-form';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button'
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext'
import axios from 'axios';
import { getSession } from 'next-auth/react'

// Configuração do ícone do marcador no mapa
const ICON = icon({
    iconUrl: "/marker.png",       // imagem do marcador
    shadowUrl: '/marker-shadow.png', // sombra do marcador
    iconAnchor: [12, 41]          // ponto do ícone que corresponde à posição no mapa (base do marcador)
})

// Componente principal que recebe uma prop protestId
export default function GeolocalizacaohMap({ protestId }) {

    // Posição inicial do mapa (latitude e longitude)
    const position = [-25.4845133, -49.2575359]

    // Estado para controlar visibilidade do formulário e dados relacionados
    const [showForm, setShowForm] = useState({ visible: false })

    // Estado para guardar coordenadas (latitude e longitude) vindas da API
    const [coordenadas, setCoordenadas] = useState(null)

    // Função para buscar as coordenadas da API, passando o protestId e dados do usuário da sessão
    const getCoords = async () => {
        const session = await getSession();  // Pega sessão do usuário autenticado
        const r = await axios.get('/api/mapcon/geolocalizacao', { params: { 
            protesto_num_seq_protesto: protestId,
            user: {
                id: session.user.id,
                perfil: session.user.perfil
            }
        } })
        // Se a API retornar dados, atualiza o estado coordenadas
        r.data ? setCoordenadas({latitude:r.data.latitude , longitude: r.data.longitude}) : null
    }

    // useEffect para chamar getCoords uma vez ao montar o componente
    useEffect(() => {
        getCoords()
    }, [])

    // Função disparada ao clicar com botão direito no mapa, para abrir o formulário
    function onMapRightClicked(pos, marker_pos) {
        // Cria um objeto com dados básicos para preencher o formulário
        const dados = {
            nivel_exatidao: '',
            latitude: String(pos.lat),
            longitude: String(pos.lng),
            protesto_num_seq_protesto: String(protestId),
            raio: ''
        }

        // Atualiza o estado para mostrar o formulário e passar os dados e posições relevantes
        setShowForm({ data: dados, marker_pos: marker_pos, pos: pos, visible: true })
    }

    // Renderiza o mapa e o formulário
    return (
        <>
            {/* Componente container do mapa com tamanho e posição inicial */}
            <MapContainer style={{ height: 400, width: "100%" }} center={latLng(position)} zoom={10} scrollWheelZoom={true}>

                {/* Camada de mapa base (tile layer) */}
                <TileLayer
                    attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                    url="https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png" />

                {/* Componente marcador e tratamento de clique no mapa */}
                <LocationMarker coordenadas={coordenadas} mapClicked={(c, m) => onMapRightClicked(c, m)} />

            </MapContainer>

            {/* Componente do formulário que aparece para adicionar ou editar a localização */}
            <GeolocalizacaoForm showForm={showForm} closeForm={() => setShowForm({ visible: false })} ></GeolocalizacaoForm>
        </>
    )
}

// Componente que controla a exibição do marcador no mapa e eventos
function LocationMarker({ coordenadas, mapClicked }) {
    // Estado local que controla a posição do marcador
    const [position, setPosition] = useState(null)

    // Quando as coordenadas mudam, atualiza a posição do marcador
    useEffect(() => {
        setPosition(coordenadas ? { lat: coordenadas.latitude, lng: coordenadas.longitude } : null)
    }, [coordenadas])

    // Função disparada ao clicar no popup do marcador (no seu caso só loga no console)
    const markerSelected = () => {
        console.log('selecionou marcador')
    }

    // Hook do leaflet que escuta eventos no mapa
    const map = useMapEvents({
        // Evento de clique com botão direito no mapa (contextmenu)
        contextmenu(e) {
            // Chama a função passada por prop para abrir o formulário, passando a posição e a função setPosition
            mapClicked(e.latlng, setPosition)
            // setPosition(e.latlng) // alternativa de atualizar a posição diretamente
        },
    })

    // Renderiza o marcador somente se a posição existir
    return position === null ? null : (
        <Marker icon={ICON} position={position} closeForm={() => setShowForm(false)}>
            {/* Popup simples que ao clicar chama markerSelected */}
            <Popup> <div onClick={() => markerSelected()} >Remover Marcador</div></Popup>
        </Marker>
    )
}



/*
    Componente do formulário dentro de um Dialog (janela modal)
    Para adicionar ou editar uma posição geográfica
*/
function GeolocalizacaoForm({ showForm, closeForm }) {

    // Opções para o dropdown de nível de exatidão
    const exatidao = [
        { id: 'Exato' },
        { id: 'Estimado' },
        { id: 'Percurso' }
    ]

    // Inicializa o React Hook Form com valores padrão
    const { control, handleSubmit, formState: { errors }, reset } = useForm({
        defaultValues: {
            nivel_exatidao: '',
            latitude: '',
            longitude: '',
            protesto_num_seq_protesto: '',
            raio: ''
        }
    });

    // Quando os dados do showForm mudam, reseta os valores do formulário com esses dados
    useEffect(() => {
        reset( showForm.data )
    }, [showForm.data])

    // Só para debug: imprime o estado atual do showForm no console
    console.log(showForm)

    // Função que será executada ao submeter o formulário
    const onSubmit = async data => {
        // Garante que o id do protesto esteja correto
        data['protesto_num_seq_protesto'] = showForm.data.protesto_num_seq_protesto

        // Pega sessão para enviar dados do usuário na requisição
        const session = await getSession();

        // Envia os dados para a API via POST
        await axios.post('/api/mapcon/geolocalizacao',{
            ...data,
            user: {
                id: session.user.id,
                perfil: session.user.perfil
            }
        })

        // Atualiza a posição do marcador chamando a função guardada no estado (setPosition do LocationMarker)
        showForm.marker_pos(showForm.pos)

        // Fecha o formulário
        closeForm(true)
    }

    // JSX do Dialog com o formulário
    return (

        <Dialog header="Adicionar Marcador" className="p-fluid" modal visible={showForm.visible} onHide={(closeForm)}>
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="p-fluid p-formgrid p-grid p-mt-lg-4 p-mt-4">

                    {/* Campo Latitude */}
                    <div className="p-field p-col-12 p-md-6">
                        <label htmlFor="latitude">Latitude*</label>
                        <Controller name="latitude" rules={{ required: true }} control={control} render={({field: { onChange, value = '' }}) =>
                            <InputText disabled={true} className={showForm.latitude ? "p-invalid" : ""} value={value} onChange={onChange}></InputText>
                        } />
                    </div>

                    {/* Campo Longitude */}
                    <div className="p-field p-col-12 p-md-6">
                        <label htmlFor="longitude">Longitude*</label>
                        <Controller name="longitude" rules={{ required: true }} control={control} render={({field: { onChange, value = '' }}) =>
                            <InputText disabled={true}  className={showForm.longitude ? "p-invalid" : ""} value={value} onChange={onChange}></InputText>
                        } />
                    </div>

                    {/* Dropdown Nível de Exatidão */}
                    <div className="p-field p-col-12 p-md-6">
                        <label htmlFor="nivel_exatidao">Nível de Exatidão*</label>
                        <Controller name="nivel_exatidao" rules={{ required: true }} control={control} render={({field: { onChange, value = '' }}) =>
                            <Dropdown className={showForm.nivel_exatidao && 'p-invalid'} value={value} options={exatidao} onChange={e => onChange(e.value)} optionLabel="id" optionValue="id" showClear placeholder="Selecione um nível de exatidão" />
                        } />
                    </div>

                    {/* Campo Raio */}
                    <div className="p-field p-col-12 p-md-6">
                        <label htmlFor="raio">Raio*</label>
                        <Controller name="raio" rules={{ required: true }} control={control} render={({field: { onChange, value = '' }}) =>
                            <InputText className={showForm.raio ? "p-invalid" : ""} value={value} onChange={onChange}></InputText>
                        } />
                    </div>

                    {/* Botão de envio */}
                    <div className="p-field p-col-12 p-md-offset-6 p-md-6">
                        <Button label={showForm.data !== undefined ? "Atualizar" : "Adicionar"} icon="pi pi-check" />
                    </div>
                </div>
            </form>
        </Dialog>
    )
}
