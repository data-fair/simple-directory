// WARN: do not use underscore in keys, it is used as delimiter when reading
// messages from environment variables

export default {
  root: {
    title: 'Simple Directory',
    description: 'Gestão simplificada de usuários e organizações para arquiteturas web modernas.'
  },
  common: {
    manageNotifications: 'Gerenciar as notificações',
    home: 'Página inicial',
    logLink: 'Entrar / cadastrar-se',
    logout: 'Sair',
    login: 'Entrar',
    signin: 'Cadastrar-se',
    activateAdminMode: 'Ativar o modo de administração',
    deactivateAdminMode: 'Desativar o modo de administração',
    documentation: 'Documentação',
    administration: 'Administração',
    myAccount: 'Informações pessoais',
    myOrganizations: 'Minhas organizações',
    organization: 'Organização',
    organizations: 'Organizações',
    organizationName: 'Nome da organização',
    user: 'Usuário',
    users: 'Usuários',
    createOrganization: 'Criar uma organização',
    dashboard: 'Painel',
    description: 'Descrição',
    id: 'Identificador',
    name: 'Nome',
    save: 'Salvar',
    send: 'Enviar',
    load: 'Carregar',
    active: 'Ativo',
    inactive: 'Inativo',
    members: 'Membros',
    orgStorageMembers: 'Membros no armazenamento secundário',
    role: 'Função',
    search: 'Pesquisar',
    noResult: 'Nenhum resultado',
    confirmOk: 'OK',
    confirmCancel: 'Cancelar',
    confirmTitle: 'Deseja confirmar esta operação?',
    firstName: 'Nome',
    lastName: 'Sobrenome',
    email: 'E-mail',
    modificationOk: 'Sua alteração foi salva.',
    invitations: 'Convites',
    accept: 'Aceitar',
    reject: 'Recusar',
    confirmDeleteTitle: 'Excluir {name}',
    confirmDeleteMsg: 'Deseja realmente excluir este recurso? Os dados não poderão ser recuperados.',
    editTitle: 'Editar {name}',
    seeTitle: 'Ver {name}',
    loggedAt: 'Último login',
    createdAt: 'Criado em',
    createdPhrase: 'Criado por {name} em {date}',
    host: 'Site',
    sites: 'Sites',
    updatedAt: 'Atualizado em',
    maxCreatedOrgs: 'Número máximo de organizações que podem ser criadas',
    maxCreatedOrgsShort: 'Máx. de org.',
    unlimited: 'ilimitado',
    nbCreatedOrgs: 'Número de organizações criadas: {count}',
    maxCreatedOrgsValue: 'Número máximo de organizações que podem ser criadas: {value}',
    back: 'Voltar',
    next: 'Avançar',
    password: 'Senha',
    showPassword: 'Mostrar a senha',
    hidePassword: 'Ocultar a senha',
    passwordShown: 'Sua senha está visível',
    passwordHidden: 'Sua senha está oculta',
    checkInbox: 'Verifique sua caixa de entrada',
    spamWarning: 'Se você não recebeu nenhum e-mail, verifique se ele não foi classificado como spam na sua caixa de correio.',
    validate: 'Validar',
    delete: 'Excluir',
    department: 'Departamento',
    departments: 'Departamentos',
    autoAdmin: 'Adicionar-me automaticamente como administrador',
    asAdmin: 'Entrar como este usuário',
    transfer: 'Transferir para outro site',
    delAsAdmin: 'Voltar à minha sessão de administrador',
    avatar: 'Avatar',
    birthday: 'Data de nascimento',
    missingInfo: 'Informações ausentes',
    '2FA': 'Autenticação de dois fatores',
    userAccount: 'Conta pessoal',
    continue: 'Continuar',
    tooLong: 'O texto é longo demais',
    settings: 'configurações',
    emailConfirmed: 'Criação finalizada',
    emailNotConfirmed: 'Criação não finalizada',
    noRole: 'sem função',
    downloadCsv: 'Baixar a lista em formato CSV',
    authMode: 'Modo de autenticação',
    authProviders: 'Provedores de autenticação',
    partners: 'Organizações parceiras',
    contactEmail: 'E-mail de contato',
    orgName: 'Nome da organização',
    loginSignin: 'Entrar / criar uma conta',
    sort: 'Ordenar',
    all: 'todos',
    creationStep: 'Etapa de criação',
    oauthTokens: 'Tokens OAuth',
    plannedDeletion: 'Exclusão programada',
    plannedDeletionShort: 'Exclusão',
    owner: 'Proprietário',
    passwordLists: 'Senhas',
    adminGlobal: 'Administração global',
    adminSite: 'Administração do site',
    no: 'Não',
    yes: 'Sim',
    redirectSite: 'Site de redirecionamento',
    manageOrg: 'Gestão da organização',
    manageDep: 'Gestão do departamento'
  },
  doc: {
    about: {
      link: 'Sobre'
    },
    install: {
      link: 'Instalação'
    },
    config: {
      link: 'Configuração',
      i18nKey: 'Chave no arquivo I18N',
      i18nVar: 'Variável de ambiente',
      i18nVal: 'Valor',
      varKey: 'Chave no arquivo de configuração',
      varName: 'Variável de ambiente',
      varDesc: 'Descrição',
      varDefault: 'Valor padrão',
      varDescriptions: {
        publicUrl: '<b>IMPORTANTE.</b> O URL em que o serviço será exposto. Por exemplo https://koumoul.com/simple-directory',
        admins: '<b>IMPORTANTE.</b> A lista dos endereços de e-mail dos administradores do serviço.',
        contact: '<b>IMPORTANTE.</b> O endereço de e-mail de contato para os usuários do serviço.',
        theme: {
          logo: 'O URL do logotipo que substitui o logotipo padrão do Simple Directory.',
          dark: 'Deixa toda a aparência das páginas escura.<br>Observe que as cores padrão são mais adequadas a um tema claro: se você mudar para o escuro, também terá de alterá-las.',
          cssUrl: 'Link para uma folha de estilo que complementa as variáveis de personalização.<br>ATENÇÃO: a estrutura HTML pode mudar de uma versão para outra. Manter uma folha de estilo externa vai gerar trabalho extra para você a cada atualização.',
          cssText: 'Conteúdo CSS bruto para complementar as variáveis de personalização.<br>ATENÇÃO: a estrutura HTML pode mudar de uma versão para outra. Manter uma folha de estilo externa vai gerar trabalho extra para você a cada atualização.'
        },
        secret: {
          public: '<b>IMPORTANTE.</b> O caminho para a chave pública de assinatura RSA. Consulte a documentação de instalação do serviço.',
          private: '<b>IMPORTANTE.</b> O caminho para a chave privada de assinatura RSA. Consulte a documentação de instalação do serviço.'
        },
        storage: {
          type: `<b>IMPORTANTE.</b> O tipo de armazenamento para a persistência de usuários e organizações.<br>
O tipo padrão "file" é somente leitura e é adequado para desenvolvimento/teste ou para usar dados exportados de outro sistema.<br>
O tipo "mongo" depende do acesso a um banco de dados MongoDB; é a opção adequada para a maioria das instalações em produção.`,
          file: {
            users: 'Apenas para storage.type=file. O caminho para o arquivo JSON que contém as definições dos usuários',
            organizations: 'Apenas para storage.type=file. O caminho para o arquivo JSON que contém as definições das organizações'
          },
          mongo: {
            url: 'Apenas para storage.type=mongo. A string de conexão completa para o banco de dados MongoDB.'
          }
        },
        mails: {
          transport: '<b>IMPORTANTE.</b> Um objeto JSON de configuração do transporte de e-mails, compatível com a biblioteca <a href="https://nodemailer.com/smtp/">nodemailer</a>.',
          from: '<b>IMPORTANTE.</b> O endereço usado como remetente dos e-mails enviados pelo serviço.'
        },
        listEntitiesMode: `Permite restringir globalmente o acesso às listas de usuários e organizações.<br>
Pode ser 'anonymous', 'authenticated' ou 'admin'.`,
        defaultLoginRedirect: 'Redirecionamento padrão após o login. Se não for especificado, o usuário será redirecionado para o seu perfil.',
        onlyCreateInvited: 'Se verdadeiro, os usuários não são criados no envio do primeiro e-mail. Eles devem ser convidados para uma organização.',
        tosUrl: '<b>IMPORTANTE.</b> O URL dos seus termos de uso. Se este parâmetro não for definido ou não apontar para uma página web válida, você corre o risco de não cumprir suas obrigações para com os seus usuários.'
      }
    },
    use: {
      link: 'Uso'
    }
  },
  pages: {
    admin: {
      users: {
        noCreatedOrgsLimit: 'Os usuários podem criar um número ilimitado de organizações.',
        createdOrgsLimit: 'Os usuários podem criar {defaultMaxCreatedOrgs} organização por padrão. | Os usuários podem criar {defaultMaxCreatedOrgs} organizações por padrão.',
        explainLimit: 'Defina um valor para limitar o número de organizações que este usuário pode criar. -1 para um número ilimitado. Esvazie o campo para voltar ao valor padrão ({defaultMaxCreatedOrgs}).',
        editUserEmailTitle: 'Alterar o endereço de e-mail do usuário {name}',
        editUserEmailText: 'Atenção: o e-mail é uma chave importante do usuário. Ao alterá-lo, você corre o risco de inserir um endereço incorreto, que não funciona ou que é inconsistente com outros registros. Este recurso só é apresentado aos administradores para desbloquear um usuário cuja caixa de correio ficou inacessível.',
        drop2FATitle: 'Redefinir a autenticação de dois fatores do usuário {name}',
        transferTitle: 'Transferir o usuário {name} para outro site',
        transferText: 'O usuário será vinculado ao site selecionado. Suas identidades SSO são redefinidas e ele mantém suas associações a organizações. Contas de superadministrador não podem ser transferidas.',
        transferTargetSite: 'Site de destino',
        transferMainSite: 'Site principal',
        drop2FAExplain: 'Atenção: esta operação é reservada ao desbloqueio de um usuário que perdeu tanto o dispositivo quanto o código de recuperação da autenticação de dois fatores. Antes de continuar, recomenda-se fortemente verificar de alguma forma a identidade da pessoa que fez a solicitação (por exemplo, entrando em contato com um colega da mesma organização).'
      },
      organizations: {
        limitOrganizationTitle: 'Alterar os limites da organização',
        members: 'membro | membros',
        nbMembers: 'Número máximo de membros (0 para sem limite)'
      },
      sites: {
        createSite: 'Definir um novo site',
        loginOnSite: 'Entrar no site',
        colorWarnings: 'Alertas de contraste',
        mainSite: 'Site principal'
      },
      passwordLists: {
        help1: 'Você pode carregar listas de senhas a partir de arquivos CSV. Essas senhas muito conhecidas serão recusadas se os usuários tentarem usá-las.',
        help2: 'Você pode encontrar arquivos de listas de senhas na internet, por exemplo no projeto {secLists} ou no projeto {richelieu} para uma lista em francês.',
        newFile: 'Novo arquivo de senhas (uma senha por linha)',
        subtitle: '{state} - {date} - {count} senha | {state} - {date} - {count} senhas',
        confirmDelete: 'Excluir esta lista de senhas?'
      },
      site: {
        title: 'Configuração do site',
        oidcHelp: 'Informe este URL de retorno de login ({url}) ao provedor de identidade e defina os escopos "openid", "profile", "email".',
        samlHelp: 'Preencha o campo abaixo com os metadados em formato XML fornecidos pelo provedor de identidade e forneça a ele, em troca, este {link}.',
        samlHelpLink: 'link',
        mainSiteExplanation: 'Este site corresponde ao domínio principal deste serviço. Seu documento no banco de dados controla apenas a apresentação, e somente para as categorias listadas em MAIN_SITE_FROM_DB. A autenticação, os provedores de identidade e o escopo das contas vêm sempre das variáveis de ambiente.'
      }
    },
    contact: {
      title: 'Fale conosco',
      from: 'Seu endereço de e-mail',
      subject: 'Assunto',
      text: 'Sua solicitação',
      sent: 'Sua solicitação foi enviada'
    },
    login: {
      title: 'Identifique-se',
      emailLabel: 'Seu endereço de e-mail',
      success: 'Você receberá um e-mail no endereço informado com um link. Abra esse link para concluir sua identificação.',
      maildevLink: 'Abrir a caixa de correio de desenvolvimento',
      newPassword: 'Nova senha',
      newPassword2: 'Confirmar a nova senha',
      changePassword: 'Redefinir a senha',
      changePasswordTooltip: 'Se você esqueceu sua senha ou precisa alterá-la, redefina-a.',
      newPasswordMsg: 'Digite a nova senha duas vezes.',
      changePasswordSent: 'Um e-mail foi enviado para o endereço {email}. Ele contém um link para alterar a senha da sua conta.',
      passwordlessMsg1: 'Para entrar, basta um e-mail.',
      passwordlessMsg2: 'Enviar um e-mail de login.',
      passwordlessConfirmed: 'Um e-mail foi enviado para o endereço {email}. Ele contém um link para entrar na plataforma.',
      createUserMsg1: 'Se você nunca entrou na nossa plataforma, crie uma conta.',
      createUserMsg2: 'Criar uma conta',
      createUserInvit: 'Crie uma conta para aceitar o convite da organização {name}',
      createUserOrganization: 'Deseja criar uma organização?',
      createUserOrganizationHelp: 'Se você criar uma organização, poderá convidar outros usuários para participar dela e compartilhar recursos.',
      tosMsg: 'Antes de criar sua conta, leia <a href="{tosUrl}" target="_blank">nossos termos de uso</a>.',
      tosConfirm: 'Confirmo que li os termos de uso deste site.',
      createUserConfirm: 'Criar a conta',
      createUserConfirmed: 'Um e-mail foi enviado para o endereço {email}. Ele contém um link para validar a criação da sua conta.',
      adminMode: 'Confirme sua identidade para entrar no modo de administração.',
      adminModePromptTitle: 'Modo de administração',
      adminModePromptMsg: 'Sua conta é uma conta de superadministrador. Deseja ativar o modo de administração para esta sessão?',
      adminModePromptAccept: 'Modo de administração',
      adminModePromptDecline: 'Sessão normal',
      oauth: 'Entrar com:',
      error: 'Erro',
      rememberMe: 'Lembrar de mim',
      '2FACode': 'código de 6 dígitos ou código de recuperação',
      '2FAInfo': 'Digite um código de verificação para continuar. Você pode obter esse código no aplicativo de verificação do seu celular. Se perder o seu dispositivo, você pode usar o código de recuperação baixado ao configurar a autenticação de dois fatores.',
      configure2FA: 'Configurar a autenticação de dois fatores',
      configure2FAQRCode: 'Código QR de configuração da autenticação de dois fatores',
      configure2FAQRCodeMsg: 'Escaneie este código QR com um aplicativo de autenticação de sua escolha (como Authy ou Google Authenticator) e, em seguida, digite o código de 6 dígitos exibido por esse aplicativo.',
      configure2FACode: 'código de 6 dígitos',
      recovery2FA: 'Código de recuperação',
      recovery2FAInfo: 'Atenção: guarde o código de recuperação abaixo em um local seguro. Sem ele, você não poderá recuperar sua conta se perder o dispositivo em que acabou de configurar a autenticação de dois fatores.',
      recovery2FACode: 'Código de recuperação: ',
      recovery2FADownload: 'Baixar um arquivo com o código de recuperação',
      recovery2FAContent: 'Código de recuperação da autenticação de dois fatores {name}',
      plannedDeletion: 'Exclusão programada',
      cancelDeletion: 'Cancelar a exclusão do usuário',
      siteLogo: 'Logotipo do site',
      partnerInvitation: 'Convite de parceiro',
      changeHost: 'Conta associada ao back-office'
    },
    siteAdmin: {
      account: 'Conta',
      '2FAActive': 'Autenticação de dois fatores ativa',
      plannedDeletion: 'Exclusão programada para {date}',
      cancelDeletion: 'Cancelar a exclusão programada de {name}',
      revokeSessions: 'Encerrar todas as sessões de {name}',
      confirmRevokeSessionsMsg: 'Todas as sessões deste usuário serão encerradas. As páginas já abertas continuam utilizáveis por alguns minutos, até que o token de sessão delas precise ser renovado.',
      confirmDeleteMsg: 'A conta {email} será excluída definitivamente e removida de todas as organizações às quais pertence.'
    },
    oauthConsent: {
      title: '{client} quer acessar sua conta',
      willBeAble: 'Este aplicativo poderá:',
      redirectHost: 'Em seguida, você será redirecionado para {host}.',
      account: 'Conta a usar',
      personalAccount: 'Conta pessoal',
      organizationAccount: 'Organização',
      allow: 'Permitir',
      deny: 'Recusar',
      broadScope: 'Acesso amplo',
      unverifiedTitle: 'Aplicativo não verificado',
      unverifiedCimd: '{client} não é um aplicativo verificado. Ele se identificou com o endereço {url}; ninguém o verificou.',
      unverifiedDcr: '{client} não é um aplicativo verificado. Ele foi registrado automaticamente; ninguém verificou sua identidade.',
      resourceMcp: 'Ele solicita acesso ao servidor MCP desta plataforma.',
      resourceApi: 'Ele solicita acesso à API desta plataforma.',
      noOrganization: 'Você não é administrador de nenhuma organização que possa autorizar este aplicativo.',
      organization: 'Organização',
      nhi: 'Identidade do aplicativo',
      nhiHint: 'As contas de serviço da organização, gerenciadas pelos seus administradores na página da organização.',
      noNhi: 'Esta organização não tem nenhuma conta de serviço que este aplicativo possa usar (cujos escopos cubram pelo menos uma das permissões solicitadas). As contas de serviço são gerenciadas pelos administradores na página da organização.',
      manageNhis: 'Gerenciar as contas de serviço',
      permissions: 'Permissões concedidas',
      lifetime: 'Duração da autorização',
      lifetime1d: '1 dia',
      lifetime7d: '7 dias',
      lifetime30d: '30 dias',
      lifetime90d: '90 dias',
      lifetime1y: '1 ano',
      errorTitle: 'Autorização impossível',
      errors: {
        interactionExpired: 'A solicitação de autorização expirou ou já foi tratada. Volte ao aplicativo e tente novamente.',
        unauthorized: 'Sua sessão expirou ou você não está conectado. Entre novamente e recomece a partir do aplicativo.',
        forbidden: 'Sua sessão não pode conceder esta autorização.',
        generic: 'A solicitação de autorização falhou (código: {code}).'
      }
    },
    organization: {
      addMember: 'Convidar um usuário para participar desta organização',
      disableInvite: 'Esta organização já atingiu o número máximo de membros.',
      deleteMember: 'Remover este usuário da lista de membros',
      editMember: 'Alterar a função deste usuário na organização',
      memberReadOnly: 'A associação deste usuário à organização vem de um provedor de identidade e não pode ser alterada aqui.',
      confirmEditMemberTitle: 'Alterar {name}',
      confirmDeleteMemberTitle: 'Excluir {name}',
      confirmDeleteMemberMsg: 'Deseja realmente remover este usuário da lista de membros da organização {org}?',
      deleteMemberSelfWarning: 'Trata-se da sua própria associação: você pode perder o acesso a esta organização e aos seus recursos, sem poder desfazer essa alteração por conta própria.',
      editMemberSelfWarning: 'Você está alterando a sua própria função: pode perder seus direitos de administração sobre esta organização, sem poder desfazer essa alteração por conta própria.',
      deleteMemberLastAdmin: 'Você é o último administrador desta organização: nomeie outro administrador antes de sair dela.',
      deleteMemberLastMember: 'Você é o último membro desta organização e não pode sair dela. Se ela não for mais usada, deve ser excluída.',
      editMemberLastAdmin: 'Você é o último administrador desta organização: nomeie outro administrador antes de alterar a sua função.',
      deleteMemberSuccess: 'O usuário {name} foi removido da organização',
      inviteEmail: 'Endereço de e-mail do usuário',
      inviteSuccess: 'Um convite foi enviado para o endereço {email}',
      invitePartnerSuccess: 'Um convite foi enviado para o endereço {email}',
      memberConflict: 'Este usuário já é membro',
      departmentLabelTitle: 'Rótulo para o conceito "departamento"',
      departmentLabelHelp: 'Deixe vazio para exibir "{defaultDepartmentLabel}". Preencha para usar outro vocabulário, como "serviço", "agência" etc.',
      addDepartment: 'Criar {departmentLabel}',
      editDepartment: 'Editar {departmentLabel}',
      deleteDepartment: 'Excluir {departmentLabel}',
      confirmEditDepartmentTitle: 'Editar {name}',
      confirmDeleteDepartmentTitle: 'Excluir {name}',
      confirmDeleteDepartmentMsg: 'Deseja realmente excluir {name} da sua organização?',
      deleteDepartmentHasMembers: 'Este departamento está atribuído a {count} membro da organização. Não é possível excluí-lo neste estado. | Este departamento está atribuído a {count} membros da organização. Não é possível excluí-lo neste estado.',
      departmentIdInvalid: 'O identificador deve conter apenas letras, números e espaços.',
      inviteLink: 'Em caso de problema na comunicação por e-mail, você pode enviar o link de confirmação abaixo por outro meio. Atenção: você corre o risco de inserir um endereço de e-mail incorreto ou que não funciona na base de usuários. Esse endereço pode causar vários problemas depois: alteração de senha, envio de alertas etc.',
      '2FARoles': 'Autenticação de dois fatores.',
      '2FARolesMsg': 'Tornar a autenticação de dois fatores obrigatória para os usuários com estas funções.',
      sendInvitationLink: 'Enviar outro link de convite',
      addPartner: 'Convidar uma organização parceira',
      deletePartner: 'Excluir este parceiro',
      depSortCreation: 'Criados por último',
      depSortAlpha: 'Ordem alfabética',
      deletePartnerWarning: 'As permissões concedidas a esta organização sobre os seus recursos serão retiradas.',
      partnerInvitationExpired: 'convite expirado',
      partnersQuotaHelp: 'Os convites pendentes contam na cota, exceto os expirados.',
      partnersQuotaPending: '{count} convite pendente ocupa uma vaga: exclua-o para liberá-la ou aguarde que expire. | {count} convites pendentes ocupam uma vaga cada: exclua um deles para liberar uma vaga ou aguarde que expirem.',
      fromCache: 'Última sincronização desta lista com o provedor de identidade: {fromNow}.',
      roleLabel: 'Rótulo da função "{role}"',
      infoTitle: 'Informações',
      siteUsersTitle: 'Contas do site',
      siteUsersHelp: 'Contas criadas neste site, o site principal da organização. Como administrador da organização, você pode redefinir a autenticação de dois fatores delas, cancelar uma exclusão programada, encerrar suas sessões ou excluí-las.',
      nhisTitle: 'Contas de serviço (identidades não humanas)',
      nhisHelp: 'As contas de serviço são as identidades não humanas da organização. Elas se autenticam com um token emitido por um provedor de identidade confiável (por exemplo, um cluster Kubernetes) ou servem de identidade para os aplicativos OAuth (por exemplo, um agente de IA) que um administrador conecta a elas. Elas não têm e-mail e suas sessões são de curta duração.',
      addNhi: 'Criar uma conta de serviço',
      editNhi: 'Editar a conta de serviço',
      deleteNhi: 'Excluir a conta de serviço',
      confirmDeleteNhiTitle: 'Excluir a conta de serviço {name}',
      confirmDeleteNhiMsg: 'Deseja realmente excluir esta conta de serviço? Os tokens em uso deixarão de funcionar assim que expirarem.',
      nhiIssuer: 'Emissor do token',
      nhiSubject: 'Sujeito',
      nhiKeyBindingHint: 'Deixe o emissor e o sujeito vazios para uma conta de serviço usada apenas por aplicativos OAuth.',
      nhiOauthOnly: 'Apenas conexões OAuth',
      nhiConnections: 'Conexões OAuth',
      nhiConnectionsCount: '{count} conexão | {count} conexões',
      nhiConnectionLastUsed: 'último uso em {date}',
      nhiConnectionNeverUsed: 'nunca usada',
      nhiConnectionExpires: 'expira em {date}',
      revokeNhiConnections: 'Revogar as conexões',
      revokeNhiConnectionsTitle: 'Revogar as conexões de {name}',
      revokeNhiConnectionsWarning: 'O cliente não poderá mais agir com esta conta de serviço. Os tokens de acesso já emitidos continuam válidos por até {duration}.',
      nhiAllowedIps: 'Endereços permitidos (opcional)',
      nhiAllowedIpsHint: 'Endereços ou sub-redes CIDR a partir dos quais a troca de token é aceita, por exemplo 203.0.113.5 ou 10.4.0.0/16. Deixe vazio para aceitar qualquer endereço.',
      nhiIpBinding: 'Vincular a sessão ao endereço a partir do qual foi obtida',
      nhiIpBindingHint: 'Um token vazado se torna inutilizável a partir de qualquer outro lugar. Ative apenas se esta conta de serviço sempre fizer chamadas a partir de um endereço estável: um endereço de saída variável (pool NAT, pilha dupla) quebraria suas sessões.',
      nhiScopes: 'Escopos (opcional)',
      nhiScopesHint: 'As permissões desta conta de serviço, por exemplo datasets:read ou datasets. Deixe vazio para uma conta sem restrição, que age com todos os direitos da sua função.',
      nhiUnrestricted: 'Acesso sem restrição (todos os direitos da sua função)',
      nhiJwks: 'JWKS (opcional, se o provedor não for acessível publicamente)',
      nhiClientId: 'Identificador do cliente (client_id)',
      nhiJwksInvalid: 'JSON inválido para o JWKS: {message}'
    },
    invitation: {
      title: 'Convite validado',
      msgSameUser: 'Seu convite para ser membro de uma organização foi validado. Você pode consultar <a href="{profileUrl}">seu perfil</a>.',
      msgDifferentUser: 'Este convite para ser membro de uma organização foi validado. Você pode <a href="{loginUrl}">entrar</a> com a conta convidada.'
    },
    avatar: {
      changeUser: 'Alterar o avatar da sua conta',
      changeOrganization: 'Alterar o avatar da organização',
      changeDepartment: 'Alterar o avatar de "{departmentName}"',
      reset: 'Restaurar o avatar padrão'
    },
    me: {
      emailNotEditable: 'Este endereço não pode ser alterado.',
      noOrganization: 'Você não é membro de nenhuma organização.',
      operations: 'Operações sensíveis',
      deleteMyself: 'Excluir esta conta',
      deleteMyselfAlert: 'Se você excluir sua conta, terá {plannedDeletionDelay} dias para cancelar a operação. Depois desse prazo, todos os dados associados serão excluídos e não poderão ser recuperados.',
      deleteMyselfCheck: 'Marque esta caixa e clique em OK para confirmar a exclusão do usuário {name} e de todos os seus dados.',
      accountChanges: 'Troca de conta',
      defaultOrg: 'Ativar esta conta por padrão após cada login',
      ignorePersonalAccount: 'Marque esta caixa se não pretende usar esta plataforma fora de uma conta de organização',
      sessions: 'Suas sessões',
      deleteSession: 'Excluir a sessão em {deviceName}?',
      deleteSessionWarning: 'A exclusão de uma sessão pode levar até {duration} para ser totalmente aplicada.',
      settings: 'Suas configurações',
      connectedApplications: 'Aplicativos conectados',
      revokeApplication: 'Revogar o acesso',
      revokeApplicationTitle: 'Revogar o acesso de {name}?',
      revokeApplicationWarning: 'O aplicativo não poderá mais usar sua conta. Os tokens de acesso já emitidos continuam válidos por até {duration}.',
      applicationGrantedOn: 'Autorizado em {date}',
      applicationLastUsed: 'último uso em {date}',
      applicationNeverUsed: 'nunca usado',
      applicationExpires: 'expira em {date}',
      applicationPersonalAccount: 'Conta pessoal'
    },
    colorsPreview: {
      title: 'Pré-visualização das cores',
      cardTitle: 'Um exemplo de cartão',
      cardText: 'Ele usa a cor "surface".'
    },
    partnerInvitation: {
      msg1: 'A organização {name} deseja adicionar {partnerName} como parceiro, com {email} como endereço de contato.',
      msg2: 'O nome "{partnerName}" é indicativo e não corresponde necessariamente ao nome exato da sua organização.',
      diffEmail: 'Você está conectado com a conta de usuário {userName} ({userEmail}). Você pode entrar com outra conta ou criar uma nova clicando no botão abaixo.',
      noUser1: 'Já tem uma conta? Você pode entrar e será redirecionado para esta página em seguida.',
      noUser2: 'Ainda não tem uma conta? Você pode criar uma e será redirecionado para esta página em seguida.',
      noOrg: 'Você não é membro de nenhuma organização. Você pode criar uma nova organização e aceitar o convite em nome dela.',
      org: 'Você pode aceitar este convite em nome de uma organização da qual é administrador ou criar uma nova organização e aceitar o convite em nome dela.',
      createOrg: 'Criar uma nova organização',
      newOrgName: 'Nome da nova organização',
      create: 'Criar',
      acceptAs: 'Aceitar em nome de {name}'
    },
    changeHost: {
      msg1: 'A conta {email} não existe em {host}, mas existe em {mainHost}.',
      sso1: 'Solução: usar {mainHost} para entrar',
      sso2: 'A página de login oferece um botão para entrar a partir de {mainHost} que você pode usar. Você também pode usar <a class="text-primary" href="{mainHostLogin}">este link</a>.',
      solution1: 'Solução: mover a conta para {host}',
      solution2: 'Se escolher esta solução, você perderá a possibilidade de entrar em {mainHost}.',
      confirmMigration: 'Mover a conta para {host} e perder o acesso a {mainHost}'
    },
    orgStorage: {
      activate: 'Ativar o armazenamento secundário de usuários',
      link: 'Link de conexão para usar este armazenamento secundário',
      ldap: 'Configuração LDAP'
    }
  },
  errors: {
    badEmail: 'O endereço de e-mail está vazio ou é inválido.',
    badProviderInvitEmail: 'O endereço de e-mail que você acabou de usar para entrar não corresponde ao endereço do convite que você recebeu',
    maxCreatedOrgs: 'O usuário não pode criar mais organizações. Limite atingido.',
    permissionDenied: 'Permissões insuficientes.',
    nonEmptyOrganization: 'Você deve remover os outros membros desta organização.',
    userUnknown: 'Usuário desconhecido.',
    orgaUnknown: 'Organização desconhecida.',
    invitationConflict: 'Este usuário já é membro da organização.',
    unknownRole: 'A função {role} é desconhecida.',
    serviceUnavailable: 'Serviço indisponível devido a manutenção.',
    badCredentials: 'Endereço de e-mail ou senha inválidos.',
    updatePassword: 'Você precisa atualizar sua senha, pois ela não é alterada há muito tempo, de acordo com nossas políticas de segurança.',
    missingToken: 'O parâmetro id_token está ausente.',
    invalidToken: 'O token não é válido. Talvez tenha expirado.',
    differentPasswords: 'As senhas são diferentes',
    noPasswordless: 'A autenticação sem senha não é aceita por este serviço.',
    rateLimitAuth: 'Muitas tentativas em um curto intervalo. Aguarde antes de tentar novamente.',
    invalidInvitationToken: 'O link de convite que você recebeu é inválido.',
    expiredInvitationToken: 'O link de convite que você recebeu expirou; você não pode mais aceitar este convite.',
    maxNbMembers: 'A organização já tem o número máximo de membros permitido pelas suas cotas.',
    maxNbDepartments: 'A organização já tem o número máximo de departamentos permitido pelas suas cotas.',
    maxNbPartners: 'A organização já tem o número máximo de parceiros permitido pelas suas cotas, incluindo os convites pendentes não expirados.',
    unknownOAuthProvider: 'Autenticação OAuth não suportada.',
    unknownSAMLProvider: 'Autenticação SAML não suportada.',
    adminModeOnly: 'Funcionalidade reservada aos superadministradores.',
    adminChangeHostBlocked: 'Os superadministradores não podem transferir sua conta para um site secundário. Entre a partir do site principal.',
    emailNotConfirmed: 'Seu endereço de e-mail ainda não foi confirmado. Um novo link de confirmação acabou de ser enviado para você; abra-o para ativar sua conta.',
    '2FANotConfigured': 'A autenticação de dois fatores é obrigatória para esta conta e ainda não está configurada.',
    passwordless2FA: 'A autenticação sem senha é incompatível com a autenticação de dois fatores exigida para esta conta.',
    bad2FAToken: 'Código de verificação da autenticação de dois fatores inválido ou expirado',
    plannedDeletion: 'A exclusão do usuário {name} e de todos os seus dados está programada para {plannedDeletion}.',
    onlyCreateInvited: 'Você não pode criar uma conta diretamente. Você precisa ser convidado por uma organização.',
    badIDPQuery: 'Solicitação considerada inválida pelo provedor de identidade.',
    badIDPResponse: 'Resposta inválida do provedor de identidade. Tente entrar novamente.',
    duplicateDep: 'O novo departamento é uma duplicata',
    passwordEntropy: 'A senha não é forte o suficiente.',
    passwordMinLength: 'A senha deve conter pelo menos {minLength} caracteres.',
    passwordMinCharClasses: 'A senha deve conter pelo menos {minCharClasses} tipos diferentes de caracteres (minúsculas, maiúsculas, dígitos, caracteres especiais).',
    forbiddenPassword: 'Esta senha foi encontrada em uma lista de senhas conhecidas e não pode ser usada.',
    samePassword: 'A nova senha deve ser diferente da antiga.',
    conflict2FA: 'A autenticação de dois fatores já está configurada para esta conta.',
    oauthNoEmail: 'Login recusado: o provedor de identidade não enviou nenhum endereço de e-mail.',
    oauthEmailNotVerified: 'Login recusado: o provedor de identidade não indica este endereço de e-mail como verificado.',
    githubNoVerifiedEmail: 'Login recusado: nenhum endereço de e-mail principal verificado foi encontrado na conta do GitHub.',
    facebookDisabled: 'O login com o Facebook está desativado: o Facebook não informa se o endereço de e-mail foi verificado.',
    partnerInvitationMismatch: 'Esta solicitação não corresponde ao convite enviado.',
    partnerConflict: 'Esta organização já é parceira.',
    noPendingPartnerInvitation: 'Nenhum convite está aguardando validação.',
    memberOfParentOrg: 'Este usuário é membro da organização principal; ele não pode ser adicionado a um departamento.',
    memberOfDepartment: 'Este usuário é membro de um departamento; ele não pode ser adicionado à organização principal.',
    departmentUnknown: 'Departamento desconhecido.',
    unknownOrgRole: 'A função {role} é desconhecida na organização {org}.',
    missingDepartmentAttribute: 'O provedor de identidade não enviou o atributo de departamento, que é obrigatório.',
    otherCoreIdProvider: 'Este usuário já está vinculado a outro provedor de identidade principal.',
    authOnlyOtherSiteChain: 'Não é possível usar o site {host} como referência para a autenticação: ele também está configurado para autenticar apenas em outro site.',
    spamSuspected: 'Mensagem recusada: a atividade se parece com a de um robô de spam.',
    rateLimitMessages: 'Muitas mensagens em um curto intervalo. Aguarde antes de tentar novamente.'
  },
  mails: {
    // the message forwarded by the contact form
    contact: {
      intro: 'Mensagem enviada pelo formulário de contato de {site} por {from}'
    },
    creation: {
      subject: 'Boas-vindas a {host}',
      text: `
Uma solicitação de criação de conta foi feita a partir de {host} para este endereço de e-mail. Para ativar a conta, copie o URL abaixo em um navegador. Este URL é válido por 15 minutos.

{link}

Se você tiver algum problema com sua conta ou se não solicitou a criação de uma conta em {host}, entre em contato conosco pelo endereço {contact}.
      `,
      htmlMsg: 'Uma solicitação de criação de conta foi feita a partir de <a href="{origin}">{host}</a> para este endereço de e-mail. Para confirmá-la, clique no botão abaixo. O link é válido por 15 minutos.',
      htmlButton: 'Confirmar a criação da conta',
      htmlAlternativeLink: 'Se o botão acima não funcionar, você pode copiar este link na barra de endereço do seu navegador:',
      htmlCaption: 'Se você tiver algum problema com sua conta ou se não solicitou a criação de uma conta em <a href="{origin}">{host}</a>, entre em contato conosco pelo endereço <a href="mailto:{contact}">{contact}</a>.'
    },
    login: {
      subject: 'Login em {host}',
      text: `
Uma solicitação de login foi feita a partir de {host}. Para confirmá-la, copie o URL abaixo em um navegador. Este URL é válido por 15 minutos.

{link}

Se você tiver algum problema com sua conta ou se não solicitou o login em {host}, entre em contato conosco pelo endereço {contact}.
      `,
      htmlMsg: 'Uma solicitação de login foi feita a partir de <a href="{origin}">{host}</a>. Para confirmá-la, clique no botão abaixo. O link é válido por 15 minutos.',
      htmlButton: 'Entrar em {host}',
      htmlAlternativeLink: 'Se o botão acima não funcionar, você pode copiar este link na barra de endereço do seu navegador:',
      htmlCaption: 'Se você tiver algum problema com sua conta ou se não solicitou o login em <a href="{origin}">{host}</a>, entre em contato conosco pelo endereço <a href="mailto:{contact}">{contact}</a>.'
    },
    noCreation: {
      subject: 'Falha de autenticação em {host}',
      text: `
Uma solicitação de login foi feita a partir de {host}, mas foi recusada porque este endereço de e-mail é desconhecido ou não foi validado.

Entre em contato conosco pelo endereço {contact}.
      `,
      htmlMsg: 'Uma solicitação de login foi feita a partir de <a href="{origin}">{host}</a>, mas foi recusada porque este endereço de e-mail é desconhecido ou não foi validado.',
      htmlCaption: 'Entre em contato conosco pelo endereço <a href="mailto:{contact}">{contact}</a>.'
    },
    conflict: {
      subject: 'Falha na criação de conta em {host}',
      text: `
Uma solicitação de criação de conta foi feita a partir de {host}, mas foi recusada porque este endereço de e-mail já está associado a uma conta.

Entre em contato conosco pelo endereço {contact}.
      `,
      htmlMsg: 'Uma solicitação de criação de conta foi feita a partir de <a href="{origin}">{host}</a>, mas foi recusada porque este endereço de e-mail já está associado a uma conta.',
      htmlCaption: 'Entre em contato conosco pelo endereço <a href="mailto:{contact}">{contact}</a>.'
    },
    invitation: {
      subject: 'Participe da organização {organization} em {host}',
      text: `
Um administrador da organização {organization} convidou você para participar dela. Para aceitar este convite, copie o URL abaixo em um navegador. Este URL é válido por 10 dias.

{link}

Se você tiver algum problema com sua conta ou se achar este convite suspeito, entre em contato conosco pelo endereço {contact}.
      `,
      htmlMsg: `
Um administrador da organização {organization} convidou você para participar dela. Para aceitar este convite, clique no botão abaixo. O link é válido por 10 dias.
      `,
      htmlButton: 'Aceitar o convite',
      htmlAlternativeLink: 'Se o botão acima não funcionar, você pode copiar este link na barra de endereço do seu navegador:',
      htmlCaption: 'Se você tiver algum problema com sua conta ou se achar este convite suspeito, entre em contato conosco pelo endereço <a href="mailto:{contact}">{contact}</a>.'
    },
    invitationSecondary: {
      subject: 'Participe da organização {organization} em {host}',
      text: `
Um administrador da organização {organization} convidou você para participar dela em {host} para acessar {secondaryHost}. Para aceitar este convite, copie o URL abaixo em um navegador. Este URL é válido por 10 dias.

{link}

Se você tiver algum problema com sua conta ou se achar este convite suspeito, entre em contato conosco pelo endereço {contact}.
      `,
      htmlMsg: `
Um administrador da organização {organization} convidou você para participar dela em {host} para acessar <b>{secondaryHost}</b>. Para aceitar este convite, clique no botão abaixo. O link é válido por 10 dias.
      `,
      htmlButton: 'Aceitar o convite',
      htmlAlternativeLink: 'Se o botão acima não funcionar, você pode copiar este link na barra de endereço do seu navegador:',
      htmlCaption: 'Se você tiver algum problema com sua conta ou se achar este convite suspeito, entre em contato conosco pelo endereço <a href="mailto:{contact}">{contact}</a>.'
    },
    partnerInvitation: {
      subject: 'A organização {organization} em {host} quer adicionar {partner} como parceiro',
      text: `
Um administrador da organização {organization} convida você, como contato da organização {partner}, a se juntar a ela em {host}. Para aceitar este convite, copie o URL abaixo em um navegador. Este URL é válido por 10 dias.

{link}

Se você tiver algum problema com sua conta ou se achar este convite suspeito, entre em contato conosco pelo endereço {contact}.
      `,
      htmlMsg: `
Um administrador da organização {organization} convida você, como contato da organização {partner}, a se juntar a ela em {host}. Para aceitar este convite, clique no botão abaixo. O link é válido por 10 dias.
      `,
      htmlButton: 'Aceitar o convite',
      htmlAlternativeLink: 'Se o botão acima não funcionar, você pode copiar este link na barra de endereço do seu navegador:',
      htmlCaption: 'Se você tiver algum problema com sua conta ou se achar este convite suspeito, entre em contato conosco pelo endereço <a href="mailto:{contact}">{contact}</a>.'
    },
    action: {
      subject: 'Realize uma ação na sua conta em {host}',
      text: `
Uma ação que exige confirmação por e-mail foi solicitada para este endereço. Para validar essa ação, copie o URL abaixo em um navegador. Este URL é válido por 15 minutos.

{link}

Se você tiver algum problema com sua conta ou se achar esta mensagem suspeita, entre em contato conosco pelo endereço {contact}.
      `,
      htmlMsg: `
Uma ação que exige confirmação por e-mail foi solicitada para este endereço. Para validar essa ação, clique no botão abaixo. O link é válido por 15 minutos.
      `,
      htmlButton: 'Validar',
      htmlAlternativeLink: 'Se o botão acima não funcionar, você pode copiar este link na barra de endereço do seu navegador:',
      htmlCaption: 'Se você tiver algum problema com sua conta ou se achar esta mensagem suspeita, entre em contato conosco pelo endereço <a href="mailto:{contact}">{contact}</a>.'
    },
    plannedDeletion: {
      subject: 'Exclusão de conta programada em {host}',
      text: `
O usuário {user} e todos os dados associados a ele serão excluídos definitivamente em {plannedDeletion}. {cause}

Para cancelar a exclusão, você pode entrar com este link: {link}.

Entre em contato conosco pelo endereço {contact}.
      `,
      htmlMsg: 'O usuário {user} e todos os dados associados a ele serão excluídos definitivamente em {plannedDeletion}. {cause}',
      htmlButton: 'Entrar para cancelar a exclusão',
      htmlAlternativeLink: 'Se o botão acima não funcionar, você pode copiar este link na barra de endereço do seu navegador:',
      htmlCaption: 'Entre em contato conosco pelo endereço <a href="mailto:{contact}">{contact}</a>.',
      causeInactivity: 'Esta operação foi acionada automaticamente porque esta conta está inativa desde {date}.'
    }
  },
  notifications: {
    sentInvitationTopic: 'um convite foi enviado',
    sentInvitation: 'Um e-mail foi enviado para {email} com um convite para participar da organização {orgName}.',
    acceptedInvitationTopic: 'um convite foi aceito',
    acceptedInvitation: 'O usuário {name} ({email}) entrou na organização {orgName}.',
    userCreated: 'O usuário {name} ({email}) se cadastrou no site {host}.',
    userCreatedOrg: 'O usuário {name} ({email}) se cadastrou no site {host} na organização {orgName}.',
    sentPartnerInvitationTopic: 'um convite de parceiro foi enviado',
    sentPartnerInvitation: 'Um e-mail foi enviado para {email} com um convite para que a organização {partnerName} se junte à organização {orgName} como parceira.',
    acceptedPartnerInvitationTopic: 'um convite de parceiro foi aceito',
    acceptedPartnerInvitation: 'A organização {partnerName} ({email}) se juntou à organização {orgName} como parceira.',
    addMemberTopic: 'um membro foi adicionado',
    addMember: 'O usuário {name} ({email}) entrou na organização {orgName}.'
  },
  // server-side only (not in publicMessages): reported through
  // mainSiteWarnings on the sites API and by the boot check
  mainSite: {
    ignoredField: 'O campo "{field}" é ignorado no site principal: esta configuração vem das variáveis de ambiente.',
    ignoredCategory: 'O valor salvo para "{category}" é ignorado: MAIN_SITE_FROM_DB não contém esta categoria.'
  },
  // server-side only: simple-directory's own scopes, merged with the platform scopes
  scopes: {
    organizations: 'Todos os escopos de organizações',
    'organizations:read': 'Ler as organizações, suas funções e seus membros',
    'all:read': 'Ler tudo o que a função permite, em todos os serviços',
    'all:write': 'Ler e modificar tudo o que a função permite, em todos os serviços',
    'all:admin': 'Todos os direitos que a função permite, em todos os serviços'
  }
}
