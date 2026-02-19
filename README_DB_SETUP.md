# Configuração do Banco de Dados

Para que o Sistema Administrativo e o Formulário de Contato funcionem corretamente, é necessário criar as tabelas no banco de dados do Supabase.

Como você já tem uma conta Supabase (indicada pelo arquivo `check-tables.ts`), siga os passos abaixo:

1.  Acesse o [Dashboard do Supabase](https://supabase.com/dashboard).
2.  Selecione o seu projeto.
3.  Vá até a seção **SQL Editor** (ícone de terminal na barra lateral esquerda).
4.  Clique em **+ New Query**.
5.  Copie e cole o conteúdo do arquivo `supabase/migrations/20260217_initial_schema.sql` (localizado no seu projeto).
    *   *Dica: Você pode abrir este arquivo no VS Code para copiar.*
6.  Clique em **Run** no canto inferior direito.

## O que isso fará?

Isso criará as seguintes tabelas no seu banco de dados:

*   `leads`: Para armazenar os orçamentos recebidos pelo site.
*   `events`: Para gerenciar sua agenda de eventos.
*   `financial_movements`: Para o seu fluxo de caixa.
*   `clients` e `suppliers`: Para cadastro de pessoas/empresas.

Além disso, configurará as permissões iniciais para que o formulário do site consiga enviar dados.

## Testando

Após rodar o script SQL:
1.  Vá até o site (`http://localhost:5173/`).
2.  Preencha o formulário de "Vamos conversar?".
3.  Verifique se aparece a mensagem de sucesso.
4.  Vá até o admin (`http://localhost:5173/admin/orcamentos`).
    *   *Nota: A integração do admin com o banco ainda precisa ser finalizada para listar os dados reais, mas o envio já estará funcionando.*
