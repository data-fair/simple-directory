// WARN: do not use underscore in keys, it is used as delimiter when reading
// messages from environment variables

export default {
  root: {
    title: 'Simple Directory',
    description: 'Uma gestão simplificada dos seus utilizadores e organizações numa arquitectura moderna orientada para a web.'
  },
  common: {
    home: 'Página inicial',
    logLink: 'Login / Registo',
    logout: 'Sair',
    login: 'Login',
    activateAdminMode: 'Activar o modo de administração',
    deactivateAdminMode: 'Desactivar o modo de administração',
    documentation: 'Documentação',
    administration: 'Administração',
    myAccount: 'A Minha Conta',
    myOrganizations: 'As minhas Organizações',
    organization: 'Organização',
    organizations: 'Organizações',
    user: 'Utilizador',
    users: 'Utilizadores',
    createOrganization: 'Criar uma organização',
    dashboard: 'Painel de instrumentos',
    description: 'Descrição',
    id: 'Login',
    name: 'Nome',
    save: 'Registe-se',
    members: 'Membros',
    role: 'Papel',
    search: 'Pesquisa',
    confirmOk: 'Ok',
    confirmCancel: 'Cancelar',
    firstName: 'Primeiro nome',
    lastName: 'Sobrenome',
    email: 'Endereço de e-mail',
    modificationOk: 'A sua modificação foi aplicada.',
    invitations: 'Convites',
    accept: 'Aceite',
    reject: 'Rejeitar',
    confirmDeleteTitle: 'Apagar {name}',
    confirmDeleteMsg: 'Tem a certeza de que quer apagar este recurso? Tenha cuidado, os dados não serão recuperáveis.',
    editTitle: 'Modificar {name}',
    loggedAt: 'Último login',
    createdAt: 'Criado em',
    host: 'Site',
    sites: 'Sites',
    createdPhrase: 'Criado por {name} em {date}.',
    updatedAt: 'Actualizado em',
    maxCreatedOrgs: 'Número máximo de organizações a serem criadas',
    nbCreatedOrgs: 'Número de organizações criadas:',
    back: 'Devolver',
    next: 'Próximo',
    password: 'Senha',
    checkInbox: 'Verifique a sua caixa de correio',
    spamWarning: 'Se não recebeu nenhum e-mail, verifique se este não foi automaticamente classificado como spam.',
    validate: 'Validar',
    department: 'Departamento',
    departments: 'Departamentos',
    autoAdmin: 'Adicionar-me automaticamente como administrador',
    asAdmin: 'Login como este utilizador',
    delAsAdmin: 'Voltar à minha sessão de administrador',
    avatar: 'Avatar',
    birthday: 'Aniversário',
    missingInfo: 'Informação em falta'
  },
  doc: {
    about: {
      link: 'Sobre nós'
    },
    install: {
      link: 'Instalação'
    },
    config: {
      link: 'Configuração',
      i18nKey: 'Chave no ficheiro I18N',
      i18nVar: 'Variável ambiental',
      i18nVal: 'Valor',
      varKey: 'Chave no ficheiro de configuração',
      varName: 'Variável ambiental',
      varDesc: 'Descrição',
      varDefault: 'Valor por defeito',
      varDescriptions: {
        publicUrl: '<b>IMPORTANTE.</b> O URL ao qual o serviço será exposto. Por exemplo https://koumoul.com/simple-directory',
        admins: '<b>IMPORTANTE.</b> A lista dos endereços electrónicos dos administradores dos serviços.',
        contact: '<b>IMPORTANTE.</b> O endereço electrónico de contacto dos utilizadores do serviço.',
        theme: {
          logo: 'O URL do logótipo a utilizar para substituir o logótipo padrão de <i>Simple Directory</i>.',
          dark: 'Torne toda a aparência das páginas escura.<br> Note que as cores por defeito são mais adequadas a um tema claro. Se mudar para escuro, terá também de mudar estas cores.',
          cssUrl: 'Ligação a uma folha de estilo para completar as variáveis de personalização.<br>AVISO: a estrutura HTML pode variar significativamente entre 2 versões. A manutenção desta folha de estilo irá criar trabalho extra para si cada vez que fizer uma actualização.',
          cssText: 'Textual CSS content.<br>WARNING: a estrutura HTML pode variar significativamente entre 2 versões. A manutenção desta folha de estilo irá criar trabalho extra para si cada vez que fizer uma actualização.'
        },
        secret: {
          public: '<b>IMPORTANTE.</b> O caminho para a chave pública de encriptação RSA. Ver a documentação de instalação do serviço.',
          private: '<b>IMPORTANTE.</b> O caminho para a chave de encriptação privada RSA. Ver a documentação de instalação do serviço.'
        },
        analytics: 'JSON para configuração analítica, corresponde à parte de configuração "módulos" da biblioteca <a href="https://github.com/koumoul-dev/vue-multianalytics#modules">vue-multianalytics</a>',
        storage: {
          type: `<b>IMPORTANTE.</b> O tipo de armazenamento para a persistência do utilizador e da organização.<br><br>
O tipo "ficheiro" padrão é apenas de leitura e é adequado para desenvolvimento/teste ou para utilizar uma colecção de utilizadores exportada de outro sistema.<br>
O tipo "mongo" depende do acesso a uma base de dados MongoDB, é o modo apropriado para a maioria das instalações em produção.`,
          file: {
            users: 'Apenas para storage.type=file. O caminho para o ficheiro JSON que contém as definições do utilizador',
            organizations: 'Apenas para storage.type=file. O caminho para o ficheiro JSON que contém as definições da organização'
          },
          mongo: {
            url: 'Apenas para storage.type=mongo. A cadeia completa de ligação à base de dados mongodb.'
          }
        },
        mails: {
          transport: '<b>IMPORTANTE.</b> Um objecto de configuração de transporte de correio JSON compatível com a biblioteca <a href="https://nodemailer.com/smtp/">nodemailer</a>.',
          from: '<b>IMPORTANTE.</b> O endereço a ser preenchido como remetente dos correios emitidos pelo serviço.'
        },
        listEntitiesMode: `Permite-lhe restringir globalmente o acesso a listas de utilizadores e organizações.<br>
Pode ser 'anónimo', 'autenticado' ou 'administrador'.`,
        defaultLoginRedirect: 'Reencaminhamento por defeito após login. Se não for especificado, o utilizador será redireccionado para o seu perfil.',
        onlyCreateInvited: 'Se os verdadeiros utilizadores não forem criados no primeiro e-mail enviado. Devem ser convidados para uma organização.',
        tosUrl: '<b>IMPORTANTE.</b> Um URL para os seus termos e condições de utilização. Se este parâmetro não for definido e não apontar para uma página web correcta, arrisca-se a não respeitar as suas obrigações para com os seus utilizadores.'
      }
    },
    use: {
      link: 'Utilização'
    }
  },
  pages: {
    admin: {
      users: {
        noCreatedOrgsLimit: 'Os utilizadores podem criar qualquer número de organizações.',
        createdOrgsLimit: 'Os utilizadores podem criar {defaultMaxCreatedOrgs} organização(ões) predefinida(s).',
        explainLimit: 'Definir um valor para limitar o número de organizações que este utilizador pode criar. -1 para qualquer número. Limpar o campo para voltar ao valor por defeito ({defaultMaxCreatedOrgs}).',
        editUserEmailTitle: 'Altere o endereço de e-mail do usuário {name}',
        editUserEmailText: 'Aviso! O e-mail é uma chave de usuário importante, ao modificar essas informações você corre o risco de inserir um endereço incorreto, não funcional ou inconsistente com outras entradas. Este recurso é apresentado apenas aos administradores para desbloquear um usuário cuja caixa de correio se torna inacessível.'
      },
      organizations: {
        limitOrganizationTitle: 'Mudar os limites organizacionais',
        members: 'membro(s)',
        nbMembers: 'Número máximo de membros (0 para sem limite)'
      }
    },
    login: {
      title: 'Faça o login na sua conta',
      emailLabel: 'O seu endereço de e-mail',
      emailCaption: 'Saiba mais sobre autenticação <a href="https://koumoul.com/blog/passwordless">sem senha</a>',
      success: 'Receberá um e-mail no endereço fornecido que conterá um link. Por favor, abra este link para completar a sua identificação.',
      maildevLink: 'Ir para a caixa de correio de desenvolvimento',
      newPassword: 'Nova palavra-passe',
      newPassword2: 'Confirmar nova senha',
      changePassword: 'Renovar palavra-passe',
      changePasswordTooltip: 'Se se esquecer da sua palavra-passe ou precisar de a alterar, renove a sua palavra-passe.',
      newPasswordMsg: 'Digite a nova senha duas vezes.',
      changePasswordSent: 'Foi-lhe enviado um e-mail para {email}. Este e-mail contém um link para alterar a senha associada à sua conta.',
      passwordlessMsg1: 'Tudo o que você precisa é de um e-mail para fazer o login.',
      passwordlessMsg2: 'Envie um e-mail de login.',
      passwordlessConfirmed: 'Foi-lhe enviado um e-mail para {email}. Este e-mail contém um link para fazer login na nossa plataforma.',
      createUserMsg1: 'Se ainda não entrou na nossa plataforma, por favor crie uma conta.',
      createUserMsg2: 'Crie uma conta',
      tosMsg: 'Antes de criar a sua conta leia por favor <a href="{tosUrl}" target="_blank">os nossos termos e condições de utilização</a>.',
      tosConfirm: 'Eu confirmo que li os termos e condições de utilização deste site.',
      createUserConfirm: 'Criar uma conta',
      createUserConfirmed: 'Foi-lhe enviado um e-mail para {email}. Este e-mail contém um link para validar a criação da conta.',
      adminMode: 'Confirme a sua identidade para entrar no modo de administração.',
      oauth: 'Faça login com :',
      error: 'Erro'
    },
    organization: {
      addMember: 'Convidar um utilizador para se juntar à organização...',
      disableInvite: 'Esta organização atingiu o seu número máximo de membros.',
      deleteMember: 'Apague este utilizador da lista de membros da organização.',
      editMember: 'Mude o papel deste utilizador na organização.',
      confirmEditMemberTitle: 'Editar {name}',
      confirmDeleteMemberTitle: 'Excluir {name}',
      confirmDeleteMemberMsg: 'Deseja realmente remover este utilizador da lista de membros da organização {org}?',
      deleteMemberSuccess: 'O utilizador {name} foi expulso da organização',
      inviteEmail: '"Endereço de e-mail do utilizador".',
      inviteSuccess: 'Foi enviado um convite para {email}',
      memberConflict: 'Este utilizador já é um membro',
      departmentLabelTitle: 'A formulação do conceito de "departamento".',
      departmentLabelHelp: 'Deixe em branco para mostrar o "departamento". Preencha as informações para usar outro vocabulário como "departamento", "agência", etc.',
      addDepartment: 'Criar {departmentLabel}',
      editDepartment: 'Editar {departmentLabel}',
      deleteDepartment: 'Eliminar {departmentLabel}',
      confirmEditDepartmentTitle: 'Editar {name}',
      confirmDeleteDepartmentTitle: 'Apagar {name}',
      confirmDeleteDepartmentMsg: 'Quer mesmo apagar o {name} da sua organização?',
      departmentIdInvalid: 'O identificador deve conter apenas letras, números e espaços.',
      inviteLink: 'Em caso de problema na comunicação por e-mail você pode enviar o link de confirmação abaixo por outro meio. Aviso ! Você corre o risco de inserir um endereço de e-mail incorreto ou não funcional no banco de dados do usuário. Este endereço de e-mail pode causar vários problemas posteriormente: alteração de senha, envio de alertas, etc.'
    },
    invitation: {
      title: 'Convite validado',
      msgSameUser: 'O seu convite para ser membro de uma organização foi aceite. Pode consultar <a href="{profileUrl}">seu perfil</a>.',
      msgDifferentUser: 'Este convite para ser membro de uma organização foi bem aceite. Pode <a href="{loginUrl}">login</a> com a conta de convidado.'
    },
    avatar: {
      prepare: 'Preparar a imagem'
    },
    me: {
      noOrganization: 'Não é membro de nenhuma organização.',
      operations: 'Operações sensíveis',
      deleteMyself: 'Apagar esta conta',
      deleteMyselfAlert: 'Se apagar a sua conta, os dados associados também serão apagados e não poderão ser recuperados.',
      deleteMyselfCheck: 'marque esta caixa e clique em OK para confirmar a eliminação.'
    }
  },
  errors: {
    badEmail: 'O endereço de email está vazio ou está incorreto.',
    maxCreatedOrgs: 'O usuário não pode criar mais organizações. Limite atingido.',
    permissionDenied: 'Permissões insuficientes.',
    nonEmptyOrganization: 'Você deve remover outros membros desta organização.',
    userUnknown: 'Usuário desconhecido.',
    orgaUnknown: 'Organização desconhecida.',
    invitationConflict: 'Este usuário já é membro da organização.',
    unknownRole: 'A função {role} é desconhecida.',
    serviceUnavailable: 'Serviço indisponível devido à manutenção.',
    badCredentials: 'Endereço de email ou senha inválidos.',
    invalidToken: 'O token não é válido. Talvez tenha expirado.',
    malformedPassword: 'A senha deve ter pelo menos 8 caracteres e conter pelo menos um número e um caractere maiúsculo.',
    noPasswordless: 'A autenticação sem senha não é aceita por este serviço.',
    rateLimitAuth: 'Muitas tentativas em um curto intervalo. Aguarde antes de tentar novamente.',
    invalidInvitationToken: 'O link de convite que você recebeu é inválido.',
    expiredInvitationToken: 'O link de convite que você recebeu expirou, você não pode mais aceitar este convite.',
    maxNbMembers: 'A organização já possui o número máximo de membros permitido por suas cotas.',
    unknownOAuthProvider: 'A identificação OAuth não é compatível.',
    adminModeOnly: 'Funcionalidade reservada para superadministradores.'
  },
  mails: {
    creation: {
      subject: 'Bem-vindo ao {host}',
      text: `
Foi feito um pedido de criação de conta a partir de {host} para este endereço de correio electrónico. Para activar a conta, é necessário copiar o URL abaixo para um browser. Este URL é válido por 15 minutos.

{link}

Se tiver um problema com a sua conta ou se não tiver solicitado a criação de uma conta em {host}, por favor contacte-nos em {contact}.
      `,
      htmlMsg: 'Foi feito um pedido de criação de conta desde <a href="{origin}">{host}</a> para este endereço de correio electrónico. Para o confirmar clique no botão abaixo. A ligação é válida por 15 minutos.',
      htmlButton: 'Confirmar a criação de conta',
      htmlAlternativeLink: 'Se o botão acima não funcionar, pode copiar esta ligação para a barra de endereço do seu navegador :',
      htmlCaption: 'Se tiver um problema com a sua conta ou se não tiver pedido para iniciar sessão em <a href="{origin}">{host}</a>, não hesite em contactar-nos em <a href="mailto:{contact}">{contact}</a>.'
    },
    login: {
      subject: 'Identificar no {host}',
      text: `
Foi feito um pedido de identificação desde {host}. Para o confirmar, copie o URL abaixo para um browser. Este URL é válido por 15 minutos.

{link}

Se tiver um problema com a sua conta ou se não tiver solicitado o login em {host}, por favor contacte-nos em {contact}.
      `,
      htmlMsg: 'Foi feito um pedido de identificação desde <a href="{origin}">{host}</a>. Para o confirmar clique no botão abaixo. A ligação é válida por 15 minutos.',
      htmlButton: 'Ligação ao {host}',
      htmlAlternativeLink: 'Se o botão acima não funcionar, pode copiar esta ligação para a barra de endereço do seu navegador :',
      htmlCaption: 'Si vous avez un problème avec votre compte ou si vous n\'avez pas demandé à vous connecter à <a href="{origin}">{host}</a>, n\'hésitez pas à nous contacter à <a href="mailto:{contact}">{contact}</a>.'
    },
    noCreation: {
      subject: 'Falha de autenticação no {host}.',
      text: `
Foi feito um pedido de identificação desde {host}, mas foi rejeitado porque este endereço de correio electrónico é desconhecido ou não foi validado.

Não hesite em contactar-nos em {contact}.
      `,
      htmlMsg: 'Foi feito um pedido de identificação desde <a href="{origin}">{host}</a>, mas foi rejeitada porque este endereço de correio electrónico é desconhecido ou não foi validado.',
      htmlCaption: 'Não hesite em contactar-nos em <a href="mailto:{contact}">{contact}</a>.'
    },
    conflict: {
      subject: 'Falha na criação de conta no {host}.',
      text: `
Foi feito um pedido de criação de conta a partir de {host}, mas foi rejeitado porque este endereço de correio electrónico já está associado a uma conta.

Não hesite em contactar-nos em {contact}.
      `,
      htmlMsg: 'Foi feito um pedido de criação de conta desde <a href="{origin}">{host}</a>, mas foi rejeitada porque este endereço de correio electrónico já está associado a uma conta.',
      htmlCaption: 'Não hesite em contactar-nos em <a href="mailto:{contact}">{contact}</a>.'
    },
    invitation: {
      subject: 'Junte-se à {organization} em {host}.',
      text: `
Foi convidado por um administrador da {organization} a juntar-se a ela. Para aceitar este convite, copie o URL abaixo para um browser. Este URL é válido por 10 dias.
Se ainda não tiver uma conta, esta será criada automaticamente.

{link}

Se encontrar algum problema com a sua conta ou se achar este convite suspeito, não hesite em contactar-nos em {contact}.
      `,
      htmlMsg: `
Foi convidado por um administrador da {organization} a juntar-se a ela. Para aceitar este convite, clique no botão abaixo. A ligação é válida por 10 dias.
Se ainda não tiver uma conta, esta será criada automaticamente.
      `,
      htmlButton: 'Aceitar o convite',
      htmlAlternativeLink: 'Se o botão acima não funcionar, pode copiar esta ligação para a barra de endereço do seu navegador :',
      htmlCaption: 'Se encontrar um problema com a sua conta ou achar este convite suspeito, por favor contacte-nos em <a href="mailto:{contact}">{contact}</a>.'
    },
    action: {
      subject: 'Execute uma acção na sua conta em {host}.',
      text: `
Uma acção solicitando uma confirmação por correio electrónico foi desencadeada neste endereço. Para validar esta acção, copiar o URL abaixo para um browser. Este URL é válido por 15 minutos.

{link}

Se encontrar um problema com a sua conta ou achar esta mensagem suspeita, não hesite em contactar-nos em {contact}.
      `,
      htmlMsg: `
Uma acção solicitando uma confirmação por correio electrónico foi desencadeada neste endereço. Para validar esta acção, clicar no botão abaixo. A ligação é válida por 15 minutos.
      `,
      htmlButton: 'Validar',
      htmlAlternativeLink: 'Se o botão acima não funcionar, pode copiar esta ligação para a barra de endereço do seu navegador :',
      htmlCaption: 'Se encontrar um problema com a sua conta ou achar esta mensagem suspeita, por favor contacte-nos em <a href="mailto:{contact}">{contact}</a>.'
    }
  }
}
