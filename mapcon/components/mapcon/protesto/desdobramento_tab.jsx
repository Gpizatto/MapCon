// Importações de componentes do PrimeReact para inputs, tabelas, botões, etc.
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog';
import { DataTable } from "primereact/datatable";
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from "primereact/dropdown"; // (Não está sendo usado nesse código)

import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form"; // Formulários reativos
import axios from "axios"; // Requisições HTTP
import { getSession } from 'next-auth/react'; // Autenticação do usuário

// Componente que gerencia os desdobramentos de um protesto
export function DesdobramentoTab({ protestId, selected }, props) {

    // Estado: lista de desdobramentos e flag de carregamento
    const [selectedValue, setselectedValue] = useState(selected);
    const [loading, setloading] = useState(false);

    // Hook de formulário: controla campos, validações e reset
    const { control, watch, handleSubmit, formState: { errors }, reset } = useForm();

    // Função chamada ao enviar o formulário
    async function onSubmit(e) {
        // Adiciona o ID do protesto à requisição
        e['protesto_num_seq_protesto'] = protestId;

        // Recupera a sessão do usuário logado
        const session = await getSession();

        // Envia o novo desdobramento para a API
        const ret = await axios.post(`/api/mapcon/desdobramento`, {
            ...e,
            user: {
                id: session.user.id,
                perfil: session.user.perfil
            }
        });

        // Se a inserção for bem-sucedida, limpa o formulário e atualiza a tabela
        if (ret.status === 200) {
            reset(); // limpa os campos
            selectedValue.push({
                id: ret.data[0].num_seq_desdobramento,
                name: ret.data[0].desdobramento
            });
            setselectedValue(selectedValue); // atualiza estado para renderização
        }
    }

    // Função para remover um item da lista, com confirmação
    async function removeValue(e) {
        confirmDialog({
            message: 'Tem certeza que deseja remover esse registro?',
            header: 'Confirmação',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sim',
            rejectLabel: 'Não',
            accept: async () => {
                const session = await getSession();

                // Requisição para deletar o desdobramento
                await axios.delete('/api/mapcon/desdobramento', {
                    data: {
                        num_seq_desdobramento: e.id,
                        user: {
                            id: session.user.id,
                            perfil: session.user.perfil
                        }
                    }
                });

                // Atualiza a lista removendo o item excluído
                const newSelectedValues = selectedValue.filter(v => v.id != e.id);
                setselectedValue(newSelectedValues);
            },
            reject: () => null // ação ao cancelar
        });
    }

    // Template para a coluna de ações (ícone de excluir)
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

    // Renderização do formulário e da tabela
    return (
        <React.Fragment>
            {/* Modal de confirmação de exclusão */}
            <ConfirmDialog />

            {/* Formulário de cadastro de desdobramento */}
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="p-fluid p-formgrid p-grid p-mt-lg-2 p-mt-2">
                    {/* Campo: Desdobramento */}
                    <div className="p-field p-col-12 p-md-6">
                        <label htmlFor="desdobramento">Desdobramento*</label>
                        <Controller
                            name="desdobramento"
                            rules={{ required: true }}
                            control={control}
                            render={({ field: { onChange, value = '' } }) => (
                                <InputText
                                    disabled={props.view}
                                    className={errors.desdobramento ? "p-invalid" : ""}
                                    value={value}
                                    onChange={onChange}
                                />
                            )}
                        />
                    </div>

                    {/* Campo: Fonte */}
                    <div className="p-field p-col-12 p-md-6">
                        <label htmlFor="fonte_desdobramento">Fonte*</label>
                        <Controller
                            name="fonte_desdobramento"
                            rules={{ required: true }}
                            control={control}
                            render={({ field: { onChange, value = '' } }) => (
                                <InputText
                                    disabled={props.view}
                                    className={errors.fonte_desdobramento ? "p-invalid" : ""}
                                    value={value}
                                    onChange={onChange}
                                />
                            )}
                        />
                    </div>

                    {/* Campo: Descritor */}
                    <div className="p-field p-col-12 p-md-12">
                        <label htmlFor="descritor_desdobramento">Descritor</label>
                        <Controller
                            name="descritor_desdobramento"
                            control={control}
                            render={({ field: { onChange, value = '' } }) => (
                                <InputTextarea
                                    disabled={props.view}
                                    rows={5}
                                    className={errors.descritor_desdobramento ? "p-invalid" : ""}
                                    value={value}
                                    onChange={onChange}
                                />
                            )}
                        />
                    </div>

                    {/* Botão de envio */}
                    <div className="p-field p-col-12 p-md-offset-9 p-md-3">
                        {!props.view ? <Button label="Adicionar" icon="pi pi-plus" /> : null}
                    </div>
                </div>
            </form>

            {/* Tabela com os desdobramentos cadastrados */}
            <DataTable loading={loading} value={selectedValue}>
                <Column field="id" header="Id" />
                <Column field="name" header="Objeto do Protesto" />
                <Column header="Ação" body={acoesTemplate} />
            </DataTable>
        </React.Fragment>
    );
}
