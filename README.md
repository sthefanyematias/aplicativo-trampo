# Trampo

Aplicativo que conecta pessoas que precisam contratar um serviço a profissionais autônomos da região. O contratante publica a demanda, recebe candidaturas, negocia por chat, acompanha a execução e avalia o profissional ao final. O contratado encontra oportunidades próximas, se candidata e constrói sua reputação por meio das avaliações recebidas. A administração acompanha os indicadores da plataforma, gerencia usuários e atende denúncias.

Este repositório reúne a API REST e o aplicativo mobile em um único projeto: o backend em Spring Boot e o frontend em React Native com Expo.

## Arquitetura

    Aplicativo Expo (React Native)
            |
            | HTTP e JSON com token JWT
            v
    API REST Spring Boot
            |
            v
          MySQL

O backend segue a separação em camadas do ecossistema Spring. Os controllers tratam a entrada HTTP e a autorização de rota, os services concentram as regras de negócio e o controle de acesso por dono do recurso, os repositories fazem o acesso a dados com Spring Data JPA e os DTOs isolam o contrato público da API das entidades de persistência. O tratamento de erros é centralizado, de modo que toda exceção de negócio resulta em uma resposta JSON padronizada.

O frontend é uma aplicação Expo com roteamento por arquivos do expo-router. O estado de sessão fica em um contexto único, as chamadas HTTP são centralizadas em um módulo de serviços e a camada visual é composta por componentes reutilizáveis com um tema de cores e espaçamentos próprio.

## Tecnologias

### Backend

| Item | Versão ou biblioteca |
|:---|:---|
| Linguagem | Java 17 |
| Framework | Spring Boot 3.5.6 |
| Persistência | Spring Data JPA com Hibernate |
| Banco de dados | MySQL |
| Segurança | Spring Security com autenticação stateless |
| Token | JJWT 0.12.6 |
| Validação | Jakarta Bean Validation |
| Build | Maven Wrapper |
| Outros | Spring Boot DevTools |

### Frontend

| Item | Versão ou biblioteca |
|:---|:---|
| Plataforma | Expo SDK 57 |
| Runtime | React Native 0.86.3 |
| React | 19.2.3 |
| Navegação | expo-router |
| Ícones | @expo/vector-icons (Ionicons) |
| Armazenamento seguro | expo-secure-store |
| Localização | expo-location |
| Interface | react-native-safe-area-context, react-native-gesture-handler, react-native-reanimated |
| Linguagem | JavaScript com configuração TypeScript para ferramentas |

## Estrutura do repositório

    trampo/
      backend/
        .mvn/
        src/main/java/br/com/trampo/
          config/
          controller/
          dto/
          exception/
          model/
          model/enums/
          repository/
          security/
          service/
        src/main/resources/
        mvnw
        mvnw.cmd
        pom.xml
      frontend/
        src/
          app/
          assets/
          components/
          context/
          services/
          theme/
          utils/
        app.json
        package.json
      .gitignore
      README.md

O backend está organizado por responsabilidade técnica e o frontend por tipo de artefato. As rotas do aplicativo ficam em `frontend/src/app`, seguindo a convenção de arquivos do expo-router.

## Modelo de domínio

| Entidade | Responsabilidade |
|:---|:---|
| Usuario | Credenciais e dados de identificação. Possui perfil de contratante, de contratado ou de administrador |
| Contratante | Perfil de quem contrata. Guarda tipo de pessoa, documento, endereço completo e coordenadas |
| Contratado | Perfil de quem executa. Guarda descrição profissional, serviços oferecidos, disponibilidade, endereço, raio de busca e média de avaliações |
| Servico | Demanda publicada pelo contratante, com valor, data, faixa de horário, período, endereço e localização |
| Candidatura | Interesse de um contratado em um serviço aberto |
| Mensagem | Mensagem trocada dentro de um serviço |
| Avaliacao | Nota de 1 a 5 e comentário de um participante sobre o outro ao final do serviço |
| Notificacao | Aviso interno gerado pelos eventos da plataforma |
| Reporte | Denúncia ou solicitação de suporte aberta por um usuário |

### Enumerações

| Enumeração | Valores |
|:---|:---|
| TipoUsuario | ADMIN, CONTRATANTE, CONTRATADO |
| StatusServico | ABERTO, EM_ANDAMENTO, CONCLUIDO, CANCELADO |
| PeriodoServico | MANHA, TARDE, NOITE |
| StatusCandidatura | PENDENTE, ACEITA, RECUSADA |
| StatusReporte | ABERTO, EM_ANALISE, RESOLVIDO |

### Ciclo de vida do serviço

    ABERTO  ->  EM_ANDAMENTO  ->  CONCLUIDO
       |
       v
    CANCELADO

O serviço nasce em ABERTO e aceita candidaturas. Ao aceitar uma candidatura, o contratado escolhido é vinculado ao serviço, as demais candidaturas passam a RECUSADA e o status muda para EM_ANDAMENTO. A partir de EM_ANDAMENTO o serviço pode ser concluído, e apenas serviços concluídos podem ser avaliados. O cancelamento é permitido enquanto o serviço não estiver concluído.

## Fluxo principal

1. O usuário se cadastra escolhendo o tipo de conta e completa o endereço com coordenadas.
2. O contratante publica um serviço informando título, descrição, valor, data, horário, período e local.
3. O contratado consulta os serviços abertos por proximidade e se candidata aos que interessam.
4. O contratante analisa as candidaturas e aceita uma delas.
5. Contratante e contratado conversam pelo chat vinculado ao serviço.
6. Qualquer um dos participantes marca o serviço como concluído.
7. As duas partes podem se avaliar, e a média do contratado é recalculada.

## Funcionalidades

### Contratante

* Cadastro e login com token JWT
* Perfil de pessoa física ou jurídica com validação de CPF ou CNPJ
* Endereço com busca de CEP e localização por GPS
* Publicação de serviços com agenda e local
* Visualização de candidaturas e aceite de uma delas
* Chat por serviço
* Conclusão, cancelamento e edição de serviços abertos
* Histórico de serviços publicados
* Avaliação do contratado
* Abertura de denúncia ou solicitação de suporte

### Contratado

* Cadastro e login com token JWT
* Perfil profissional com descrição, serviços oferecidos, disponibilidade e raio de busca
* Listagem de serviços abertos por proximidade, ordenada por distância
* Candidatura a serviços abertos
* Chat por serviço
* Histórico de serviços aceitos e concluídos
* Recebimento de avaliações com média exibida no perfil

### Administração

* Painel com resumo da plataforma
* Listagem e gestão de usuários
* Visualização de todos os serviços
* Fila de suporte com denúncias, início de análise e resposta
* Criação automática do usuário administrador inicial na subida da aplicação

### Recursos transversais

* Notificações internas com contador de não lidas
* Busca de endereço por CEP na API pública do ViaCEP
* Máscaras e validação de CPF, CNPJ, telefone, CEP, data e hora
* Sessão persistida no dispositivo e encerrada automaticamente quando o token expira

## API REST

A API responde em JSON na porta 8080 por padrão. As rotas protegidas exigem o cabeçalho `Authorization: Bearer <token>`. As listagens paginadas recebem os parâmetros `page` e `size`, com `page` iniciando em zero, e devolvem um objeto com `conteudo`, `pagina`, `tamanho`, `total`, `totalPaginas` e `ultima`.

### Autenticação

| Método | Rota | Acesso |
|:---|:---|:---|
| POST | /auth/login | Público |
| GET | /auth/me | Autenticado |

### Usuários

| Método | Rota | Acesso |
|:---|:---|:---|
| POST | /usuarios | Público |
| GET | /usuarios | Administrador |
| GET | /usuarios/{id} | Administrador |
| PUT | /usuarios/me | Autenticado |
| PUT | /usuarios/{id} | Administrador |
| DELETE | /usuarios/{id} | Administrador |

### Contratantes

| Método | Rota | Acesso |
|:---|:---|:---|
| POST | /contratantes/usuario/{usuarioId} | Contratante |
| GET | /contratantes | Autenticado |
| GET | /contratantes/me | Contratante |
| GET | /contratantes/{id} | Autenticado |
| PUT | /contratantes/me | Contratante |
| PUT | /contratantes/{id} | Contratante |
| DELETE | /contratantes/me | Contratante |
| DELETE | /contratantes/{id} | Contratante |

### Contratados

| Método | Rota | Acesso |
|:---|:---|:---|
| POST | /contratados/usuario/{usuarioId} | Contratado |
| GET | /contratados | Autenticado |
| GET | /contratados/me | Contratado |
| GET | /contratados/{id} | Autenticado |
| PUT | /contratados/me | Contratado |
| PUT | /contratados/{id} | Contratado |
| DELETE | /contratados/me | Contratado |
| DELETE | /contratados/{id} | Contratado |

### Serviços

| Método | Rota | Acesso |
|:---|:---|:---|
| POST | /servicos/contratante/{contratanteId} | Contratante |
| GET | /servicos | Autenticado |
| GET | /servicos/abertos | Autenticado |
| GET | /servicos/proximos | Autenticado |
| GET | /servicos/contratante/{contratanteId} | Autenticado |
| GET | /servicos/contratado/{contratadoId} | Autenticado |
| GET | /servicos/{id} | Autenticado |
| PUT | /servicos/{id} | Contratante |
| PUT | /servicos/{id}/concluir | Participante do serviço |
| PUT | /servicos/{id}/cancelar | Contratante |
| DELETE | /servicos/{id} | Contratante |

A rota `/servicos/proximos` recebe `latitude`, `longitude` e `raioKm` e devolve os serviços abertos dentro do raio, ordenados da menor para a maior distância.

### Candidaturas

| Método | Rota | Acesso |
|:---|:---|:---|
| POST | /candidaturas/servico/{servicoId}/contratado/{contratadoId} | Contratado |
| PUT | /candidaturas/{id}/aceitar | Contratante |
| GET | /candidaturas/servico/{servicoId} | Contratante responsável |
| GET | /candidaturas/contratado/{contratadoId} | Contratado |
| GET | /candidaturas/pendentes | Contratante |
| GET | /candidaturas/pendentes/quantidade | Contratante |

### Conversas e mensagens

| Método | Rota | Acesso |
|:---|:---|:---|
| GET | /conversas | Autenticado |
| GET | /mensagens/servico/{servicoId} | Participante do serviço |
| POST | /mensagens/servico/{servicoId}/remetente/{remetenteId} | Participante do serviço |

A rota `/conversas` devolve os serviços em que o usuário participa, com a última mensagem e a data do último contato.

### Avaliações

| Método | Rota | Acesso |
|:---|:---|:---|
| POST | /avaliacoes/servico/{servicoId}/avaliador/{avaliadorId}/avaliado/{avaliadoId} | Participante do serviço |
| GET | /avaliacoes/servico/{servicoId}/minha | Autenticado |
| GET | /avaliacoes/servico/{servicoId}/ja-avaliei | Autenticado |
| GET | /avaliacoes/avaliado/{avaliadoId} | Autenticado |

### Notificações

| Método | Rota | Acesso |
|:---|:---|:---|
| GET | /notificacoes | Autenticado |
| GET | /notificacoes/nao-lidas/quantidade | Autenticado |
| PUT | /notificacoes/{id}/ler | Autenticado |
| PUT | /notificacoes/ler-todas | Autenticado |

### Reportes

| Método | Rota | Acesso |
|:---|:---|:---|
| POST | /reportes | Autenticado |
| GET | /reportes/meus | Autenticado |
| GET | /reportes | Administrador |
| GET | /reportes/abertos/quantidade | Administrador |
| PUT | /reportes/{id}/analisar | Administrador |
| PUT | /reportes/{id}/resolver | Administrador |

### Administração

| Método | Rota | Acesso |
|:---|:---|:---|
| GET | /admin/resumo | Administrador |

## Autenticação e autorização

O login em `/auth/login` recebe email e senha, valida as credenciais e devolve um token JWT acompanhado dos dados do usuário. O token é assinado com a chave definida em `trampo.jwt.secret` e expira em 24 horas por padrão, conforme `trampo.jwt.expiration`.

O filtro de autenticação lê o cabeçalho `Authorization`, valida a assinatura e carrega o usuário autenticado. A aplicação é stateless, ou seja, não mantém sessão no servidor.

As senhas são armazenadas com hash BCrypt. O email é único na base. A senha exige no mínimo 8 caracteres.

A autorização acontece em duas camadas. A configuração de segurança define o perfil mínimo por rota, com os papéis ROLE_ADMIN, ROLE_CONTRATANTE e ROLE_CONTRATADO. Os services reforçam a regra verificando se o usuário autenticado é o dono do recurso que está sendo alterado, de modo que um contratante não consiga operar sobre o perfil ou o serviço de outro. O administrador é dispensado das verificações de propriedade.

No aplicativo, o token é guardado no armazenamento seguro do dispositivo e a sessão é restaurada na abertura. Respostas com status 401 encerram a sessão e levam o usuário de volta à tela de login.

## Como executar

### Pré requisitos

* Java 17
* MySQL em execução
* Node.js com npm
* Aplicativo Expo Go no celular ou um emulador Android ou iOS, para executar o frontend

### Backend

1. Crie o banco. A aplicação cria o schema automaticamente, pois a URL de conexão usa `createDatabaseIfNotExist=true` e o Hibernate está configurado com `ddl-auto=update`.
2. Defina as variáveis de ambiente `DB_SENHA` e `JWT_SECRET`. Se o seu MySQL não usar o usuário root, defina também `DB_USUARIO`.
3. Suba a aplicação:

```
cd backend
./mvnw spring-boot:run
```

No Windows, use `mvnw.cmd spring-boot:run`.

4. A API fica disponível em `http://localhost:8080`. Para verificar, faça uma requisição em `GET /servicos/abertos` com um token válido.

Alternativamente, as mesmas propriedades podem ser informadas em um arquivo `application-local.properties` dentro de `src/main/resources`. Esse arquivo está listado no `.gitignore` e não deve ser versionado.

### Frontend

1. Instale as dependências:

```
cd frontend
npm install
```

2. Inicie o servidor de desenvolvimento:

```
npx expo start
```

3. Abra no Expo Go, emulador ou navegador conforme as opções exibidas no terminal.

O aplicativo determina a URL da API automaticamente. No emulador Android usa `http://10.0.2.2:8080`, que é o endereço do host visto de dentro do emulador. Nas demais plataformas usa `http://localhost:8080`. Para apontar para outra máquina, como um celular físico na mesma rede, defina `EXPO_PUBLIC_API_URL` antes de iniciar o Expo:

```
EXPO_PUBLIC_API_URL=http://192.168.0.10:8080 npx expo start
```

## Variáveis de ambiente

### Backend

| Variável | Obrigatória | Descrição |
|:---|:---|:---|
| DB_SENHA | Sim | Senha do usuário do MySQL |
| JWT_SECRET | Sim | Chave usada para assinar os tokens. Deve ter pelo menos 32 caracteres |
| DB_USUARIO | Não | Usuário do MySQL, quando diferente de root |
| ADMIN_EMAIL | Não | Email do administrador criado na subida da aplicação |
| ADMIN_SENHA | Não | Senha do administrador criado na subida da aplicação |

### Frontend

| Variável | Obrigatória | Descrição |
|:---|:---|:---|
| EXPO_PUBLIC_API_URL | Não | URL base da API. Quando ausente, o aplicativo usa o endereço padrão da plataforma |

O usuário administrador inicial só é criado quando `ADMIN_EMAIL` e `ADMIN_SENHA` estão preenchidos e ainda não existe usuário com aquele email. Em ambiente real, defina as duas variáveis e não utilize valores padrão.

## Tratamento de erros

Todas as exceções passam por um tratador central que devolve o mesmo formato de resposta:

```
{
  "status": 400,
  "mensagem": "Mensagem descritiva do erro"
}
```

| Status | Situação |
|:---|:---|
| 400 | Regra de negócio violada ou dados inválidos na requisição |
| 401 | Credenciais inválidas, token ausente ou token expirado |
| 403 | Usuário autenticado sem permissão para o recurso |
| 404 | Recurso não encontrado |
| 409 | Conflito, como email já cadastrado ou registro com vínculos |
| 500 | Erro interno não previsto |

No aplicativo, os erros são convertidos em uma exceção própria que carrega a mensagem devolvida pela API, e a interface exibe essa mensagem ao usuário.

## Regras de negócio

1. O email é único entre usuários e a senha exige no mínimo 8 caracteres.
2. O cadastro exige endereço completo e coordenadas, que são a base das buscas por proximidade.
3. Somente o contratante publica serviços, e o perfil precisa ter localização cadastrada.
4. A agenda do serviço exige data, horário inicial, horário final coerente e período definido.
5. Serviços só podem ser editados enquanto estão ABERTO.
6. Candidaturas só são aceitas em serviços ABERTO, e o mesmo contratado não pode se candidatar duas vezes ao mesmo serviço.
7. O aceite de uma candidatura vincula o contratado ao serviço, recusa as demais candidaturas e move o serviço para EM_ANDAMENTO.
8. Apenas participantes do serviço trocam mensagens e consultam o histórico da conversa.
9. Um serviço em andamento não pode ser excluído, e um serviço concluído não pode ser cancelado.
10. A avaliação exige serviço CONCLUIDO, nota entre 1 e 5, participantes do serviço e no máximo uma avaliação por avaliador em cada serviço.
11. Cada nova avaliação recalcula a média do perfil avaliado.
12. Denúncias podem ser vinculadas a um serviço, e nesse caso o usuário precisa participar dele.
13. O atendimento de denúncias segue a ordem ABERTO, EM_ANALISE e RESOLVIDO, com resposta registrada na conclusão.
14. A administração é exclusiva do perfil ADMIN.

## Decisões técnicas

* A API é stateless e usa JWT, o que permite escalar horizontalmente sem sessão compartilhada.
* O contrato da API usa DTOs, evitando expor entidades de persistência e campos sensíveis como a senha.
* A autorização por dono do recurso fica no service, e não apenas na configuração de rotas, porque depende do vínculo entre usuário e registro.
* O frontend centraliza as chamadas HTTP em um único módulo, com token, tempo limite de 15 segundos e tratamento uniforme de erros.
* O tema visual fica isolado em um arquivo de cores e espaçamentos, o que mantém os componentes consistentes.
* O cálculo de proximidade é feito a partir das coordenadas dos serviços abertos, com ordenação por distância antes da paginação.

## Melhorias técnicas sugeridas

* Adotar migrações versionadas com Flyway ou Liquibase no lugar de `ddl-auto=update`.
* Desligar `spring.jpa.show-sql` em produção e externalizar toda a configuração por ambiente.
* Adicionar testes automatizados de integração para os fluxos de candidatura, conclusão e avaliação.
* Documentar a API com OpenAPI e disponibilizar uma coleção de requisições para testes.
* Registrar imagens de portfólio dos profissionais em um serviço de armazenamento de arquivos.
