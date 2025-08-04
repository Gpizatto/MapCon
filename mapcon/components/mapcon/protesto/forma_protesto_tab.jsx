// Importação de componentes PrimeReact
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog';
import { DataTable } from "primereact/datatable";
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea'; // (Não está sendo usado aqui)
import { Dropdown } from "primereact/dropdown";

// React e hooks
import React, { useState } from "react";

// React Hook Form para controle do formulário
import { useForm, Controller } from "react-hook-form";

// Requisições HTTP
import axios from "axios";

// Autenticação do usuário com NextAuth
import { getSession } from 'next-auth/react';

// Componente que permite cadastrar "formas de protesto" ligadas a um protesto específico
export function FormaProtestoTab({ protestId, options, selected }, props) {

    // Lista de formas de protesto cadastradas + estado de carregamento
    const [selectedValue, setselectedValue] = useState(selected);
    const [loading, setloading] = useState(false);

    // Hook de formulário
    const { control, watch, handleSubmit, formState: { errors }, reset } = useForm();

    // Ao enviar o formulário (adicionar nova forma de protesto)
    async function onSubmit(e) {
        e['protesto_num_seq_protesto'] = protestId;

        // Recupera o nome do repertório da ação escolhido
        const nameCategory = options.filter(option => option.id == e.repertorio_acao_num_seq_repertorio_acao)[0].name;

        // Obtém sessão do usuário
        const session = await getSession();

        // Envia os dados para a API
        const ret = await axios.post(`/api/mapcon/forma_protesto`, {
            ...e,
            user: {
                id: session.user.id,
                perfil: session.user.perfil
            }
        });

        // Se bem-sucedido, atualiza lista e reseta formulário
        if (ret.status === 200) {
            reset();
            selectedValue.push({
                id: ret.data[0].num_seq_forma_protesto,
                name: ret.data[0].forma_protesto,
                repertorio: nameCategory
            });
            setselectedValue(selectedValue);
        }
    }

    // Confirma e remove uma forma de protesto da lista
    async function removeValue(e) {
        confirmDialog({
            message: 'Tem certeza que deseja remover esse registro?',
            header: 'Confirmação',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sim',
            rejectLabel: 'Não',
            accept: async () => {
                const session = await getSession();

                // Envia solicitação de exclusão
                await axios.delete('/api/mapcon/forma_protesto', {
                    data: {
                        num_seq_forma_protesto: e.id,
                        user: {
                            id: session.user.id,
                            perfil: session.user.perfil
                        }
                    }
                });

                // Remove item da lista atual
                const newSelectedValues = selectedValue.filter(v => v.id != e.id);
                setselectedValue(newSelectedValues);
            },
            reject: () => null
        });
    }

    // Template de botão de ação (excluir)
    function acoesTemplate(rowData) {
        return (
            <Button
                onClick={() => removeValue(rowData)}
                style={{ float: 'right' }}
                icon="pi pi-times"
                className="p-button-rounded p-button-danger"
            />
        );
    }

    // Renderização do componente
    return (
        <React.Fragment>
            {/* Modal de confirmação para exclusão */}
            <ConfirmDialog />

            {/* Formulário de cadastro */}
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="p-fluid p-formgrid p-grid p-mt-lg-2 p-mt-2">

                    {/* Campo: Forma de Protesto */}
                    <div className="p-field p-col-12 p-md-6">
                        <label htmlFor="forma_protesto">Forma de Protesto*</label>
                        <Controller
                            name="forma_protesto"
                            rules={{ required: true }}
                            control={control}
                            render={({ field: { onChange, value = '' } }) => (
                                <InputText
                                    disabled={props.view}
                                    className={props.forma_protesto ? "p-invalid" : ""}
                                    value={value}
                                    onChange={onChange}
                                />
                            )}
                        />
                    </div>

                    {/* Campo: Repertório da Ação */}
                    <div className="p-field p-col-12 p-md-6">
                        <label htmlFor="repertorio_acao_num_seq_repertorio_acao">Repertório da Ação*</label>
                        <Controller
                            name="repertorio_acao_num_seq_repertorio_acao"
                            rules={{ required: true }}
                            control={control}
                            render={({ field: { onChange, value = '' } }) => (
                                <Dropdown
                                    className={props.repertorio_acao_num_seq_repertorio_acao && 'p-invalid'}
                                    value={value}
                                    options={options}
                                    onChange={e => onChange(e.value)}
                                    optionLabel="name"
                                    optionValue="id"
                                    filter
                                    filterBy="name"
                                    showClear
                                    placeholder="Selecione uma categoria"
                                />
                            )}
                        />
                    </div>

                    {/* Botão "Adicionar" */}
                    <div className="p-field p-col-12 p-md-offset-9 p-md-3">
                        {!props.view ? <Button label="Adicionar" icon="pi pi-plus" /> : null}
                    </div>
                </div>
            </form>

            {/* Tabela de formas de protesto cadastradas */}
            <DataTable loading={loading} value={selectedValue}>
                <Column field="id" header="Id" />
                <Column field="name" header="Objeto do Protesto" />
                <Column field="repertorio" header="Repertório da ação" />
                <Column header="Ação" body={acoesTemplate} />
            </DataTable>
        </React.Fragment>
    );
}
