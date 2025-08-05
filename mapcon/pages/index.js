import React from 'react';
// Importa dynamic do Next.js para carregamento dinâmico de componentes (sem SSR)
import dynamic from 'next/dynamic'

// Importa conexão com banco (Knex configurado)
import db from '../lib/back/db.js';

// Importa componente da barra superior do site
import ToolbarSite from '../components/toolbar_site';

function Index(props) {
  // Importa o componente MainMap dinamicamente, desabilitando SSR (server-side rendering)
  // Isso é útil para componentes que usam APIs do navegador, como mapas
  const MainMap = dynamic(() => import("../components/mapcon/main_map"), { ssr: false });

  return (
    <div>
      {/* Renderiza a barra superior */}
      <ToolbarSite /> 

      {/* Renderiza o mapa passando os dados dos conflitos */}
      <MainMap conflitos={props.conflitos}/>
    </div>
  );
}

// Função do Next.js para buscar dados no servidor a cada requisição
export async function getServerSideProps(context) {
  // Faz consulta direta usando raw SQL para buscar todos os registros da view/tabela mapa_protestos
  const conflitos = await db.raw('SELECT * FROM mapa_protestos;');

  // Retorna os dados via props para o componente Index
  return {
    props: {
      conflitos: conflitos.rows
    }
  }
}

export default Index
