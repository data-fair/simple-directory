// WARN: do not use underscore in keys, it is used as delimiter when reading
// messages from environment variables

module.exports = {
  root: {
    title: 'Simple Directory',
    description: 'Gestión simplificada de sus usuarios y organizaciones en una moderna arquitectura orientada a la web.'
  },
  common: {
    home: 'Página inicial',
    logLink: 'Iniciar sesión / Registrarse',
    logout: 'Desconectarse',
    login: 'Connecterse',
    activateAdminMode: 'Activar el modo de administrador',
    deactivateAdminMode: 'Desactivar el modo de administrador',
    documentation: 'Documentación',
    administration: 'Administración',
    myAccount: 'Mi cuenta',
    myOrganizations: 'Mis organizaciones',
    organization: 'Organización',
    organizations: 'Organizaciones',
    user: 'Usuario',
    users: 'Usuarios',
    createOrganization: 'Crea una organización',
    dashboard: 'Salpicadero',
    description: 'Descripción',
    id: 'Nombre de usuario',
    name: 'Apellido',
    save: 'Grabar',
    members: 'Miembros',
    role: 'Papel',
    search: 'Buscar',
    confirmOk: 'Ok',
    confirmCancel: 'Anular',
    firstName: 'Nombre de pila',
    lastName: 'Apellido',
    email: 'Correo electrónico',
    modificationOk: 'Se ha aplicado su cambio.',
    invitations: 'Invitaciones',
    accept: 'Aceptar',
    reject: 'Rechazar',
    confirmDeleteTitle: 'Eliminar {name}',
    confirmDeleteMsg: '¿Estás seguro de que deseas eliminar este recurso? Tenga en cuenta que los datos no se pueden recuperar.',
    editTitle: 'Modificar {name}',
    loggedAt: 'Último acceso',
    createdAt: 'Creó el',
    createdHost: 'Creado a partir del sitio',
    createdPhrase: 'Creado por {name} el {date}',
    updatedAt: 'Actualizado el',
    maxCreatedOrgs: 'Número máximo de organizaciones a crear',
    nbCreatedOrgs: 'Número de organizaciones creadas:',
    back: 'Regreso',
    next: 'Próximo',
    password: 'Contraseña',
    checkInbox: 'Revisa tu correo',
    spamWarning: 'Si no ha recibido un correo electrónico, compruebe que no se haya clasificado automáticamente como spam.',
    validate: 'Validar',
    department: 'Departamento',
    departments: 'Departamentos',
    autoAdmin: 'Agregarme automáticamente como administrador',
    asAdmin: 'Iniciar sesión como este usuario',
    delAsAdmin: 'Regresar a mi sesión de administrador',
    avatar: 'Avatar',
    birthday: 'Aniversario',
    missingInfo: 'Falta información'
  },
  doc: {
    about: {
      link: 'A proposito'
    },
    install: {
      link: 'Instalación'
    },
    config: {
      link: 'Configuración',
      i18nKey: 'Llave en el archivo de I18N',
      i18nVar: 'Variable ambiental',
      i18nVal: 'Valor',
      varKey: 'Llave el archivo de configuración',
      varName: 'Variable ambiental',
      varDesc: 'Descripción',
      varDefault: 'Valor por defecto',
      varDescriptions: {
        publicUrl: '<b>IMPORTANTE.</b> La URL a la que estará expuesto el servicio. Por ejemplo https://koumoul.com/simple-directory',
        admins: '<b>IMPORTANTE.</b> La lista de direcciones de correo electrónico de los administradores de servicios.',
        contact: '<b>IMPORTANTE.</b> La dirección de correo electrónico de contacto de los usuarios del servicio.',
        theme: {
          logo: 'La URL del logotipo que se utilizará para reemplazar el logotipo predeterminado para <i>Simple Directory</i>.',
          dark: 'Haga que la apariencia completa de las páginas sea oscura.<br>Tenga en cuenta que los colores predeterminados son más adecuados para un tema claro. Si te oscureces también tendrás que cambiar estos colores.',
          cssUrl: 'Enlace a una hoja de estilo para completar las variables de personalización.<br>PRECAUCIÓN: la estructura HTML puede variar significativamente entre 2 versiones. Mantener esta hoja de estilo creará trabajo adicional para usted cada vez que actualice.',
          cssText: 'Contenido CSS textual.<br>PRECAUCIÓN: la estructura HTML puede variar significativamente entre 2 versiones. Mantener esta hoja de estilo creará trabajo adicional para usted cada vez que actualice.'
        },
        secret: {
          public: '<b>IMPORTANTE.</b> La ruta a la clave pública de cifrado RSA. Consulte la documentación de instalación del servicio.',
          private: '<b>IMPORTANTE.</b> La ruta a la clave privada de cifrado RSA. Consulte la documentación de instalación del servicio.'
        },
        analytics: 'JSON de configuración de análisis, corresponde a la parte de "módulos" de la configuración de la biblioteca <a href="https://github.com/koumoul-dev/vue-multianalytics#modules">vue-multianalytics</a>',
        storage: {
          type: `<b>IMPORTANTE.</b> El tipo de almacenamiento para la persistencia del usuario y la organización.<br>
El tipo de "archivo" predeterminado es de solo lectura y es adecuado para desarrollo/pruebas o para usar una colección de usuarios exportada desde otro sistema.<br>
El tipo "mongo" depende del acceso a una base de datos MongoDB, este es el modo apropiado para la mayoría de las instalaciones de producción.`,
          file: {
            users: 'Solo para storage.type=file. La ruta del archivo JSON que contiene las definiciones de usuario',
            organizations: 'Solo para storage.type=file. La ruta del archivo JSON que contiene las definiciones de la organización'
          },
          mongo: {
            url: 'Solo para storage.type=mongo. La cadena de conexión completa a la base de datos mongodb.'
          }
        },
        mails: {
          transport: '<b>IMPORTANTE.</b> Un objeto JSON de configuración de transporte de correo compatible con la biblioteca <a href="https://nodemailer.com/smtp/">nodemailer</a>.',
          from: '<b>IMPORTANTE.</b> La dirección que se ingresará como remitente de los correos electrónicos enviados por el servicio.'
        },
        listEntitiesMode: `Le permite restringir globalmente el acceso a listas de usuarios y organizaciones.<br>
Puede ser 'anonymous', 'authenticated' o 'admin'.`,
        defaultLoginRedirect: 'Redirección predeterminada después de iniciar sesión. Si no se especifica, el usuario será redirigido a su perfil.',
        onlyCreateInvited: 'Si es verdadero, los usuarios no se crearán en el primer correo electrónico enviado. Deben ser invitados a una organización.',
        tosUrl: '<b>IMPORTANTE.</b> Una URL a sus términos de uso. Si este parámetro no está definido y no apunta a una página web correcta, corre el riesgo de no cumplir con sus obligaciones para con sus usuarios.'
      }
    },
    use: {
      link: 'Utilizar'
    }
  },
  pages: {
    admin: {
      users: {
        noCreatedOrgsLimit: 'Los usuarios pueden crear cualquier número de organizaciones.',
        createdOrgsLimit: 'Los usuarios pueden crear {defaultMaxCreatedOrgs} organizacione(s) predeterminadas.',
        explainLimit: 'Establezca un valor para limitar la cantidad de organizaciones que este usuario puede crear. -1 para un número no especificado. Vacíe el campo para volver al valor predeterminado ({defaultMaxCreatedOrgs}).',
        editUserEmailTitle: 'Cambiar la dirección de correo electrónico del usuario {nombre}',
        editUserEmailText: '¡Advertencia! El correo electrónico es una clave de usuario importante, al modificar esta información, corre el riesgo de insertar una dirección incorrecta, no funcional o inconsistente con otras entradas. Esta función solo se presenta a los administradores para desbloquear a un usuario cuyo buzón se vuelve inaccesible.'
      },
      organizations: {
        limitOrganizationTitle: 'Cambiar los límites organizacionales',
        members: 'miembro(s)',
        nbMembers: 'Número máximo de miembros (0 sin límite)'
      }
    },
    login: {
      title: 'Identifícate',
      emailLabel: 'Tu correo electrónico',
      emailCaption: 'Más información sobre la autenticación <a href="https://koumoul.com/blog/passwordless">sin contraseña</a>',
      success: 'Recibirá un correo electrónico a la dirección proporcionada que contendrá un enlace. Abra este enlace para completar su identificación.',
      maildevLink: 'Acceder al buzón de desarrollo',
      newPassword: 'Nueva contraseña',
      newPassword2: 'Nueva contraseña',
      changePassword: 'Renovar contraseña',
      changePasswordTooltip: 'Si olvida su contraseña o necesita cambiarla, renueve su contraseña.',
      newPasswordMsg: 'Ingrese la nueva contraseña dos veces.',
      changePasswordSent: 'Se ha enviado un correo electrónico a la dirección {email}. Este correo electrónico contiene un enlace para cambiar la contraseña asociada con su cuenta.',
      passwordlessMsg1: 'Para conectar un correo electrónico es suficiente.',
      passwordlessMsg2: 'Envíe un correo electrónico de inicio de sesión.',
      passwordlessConfirmed: 'Se ha enviado un correo electrónico a la dirección {email}. Este correo electrónico contiene un enlace para conectarse a nuestra plataforma.',
      createUserMsg1: 'Si aún no ha iniciado sesión en nuestra plataforma, cree una cuenta.',
      createUserMsg2: 'Crear una cuenta',
      tosMsg: 'Antes de crear su cuenta, lea <a href="{tosUrl}" target="_blank">nuestras condiciones generales de uso</a>.',
      tosConfirm: 'Confirmo que he leído las condiciones generales de uso de este sitio.',
      createUserConfirm: 'Crear una cuenta',
      createUserConfirmed: 'Se ha enviado un correo electrónico a la dirección {email}. Este correo electrónico contiene un enlace para validar la creación de la cuenta.',
      adminMode: 'Confirme su identidad para cambiar al modo de administración.',
      oauth: 'Conectar con:',
      error: 'Error'
    },
    organization: {
      addMember: 'Invitar a un usuario a unirse a la organización',
      disableInvite: 'Esta organización ha alcanzado su número máximo de miembros.',
      deleteMember: 'Eliminar a este usuario de la lista de miembros de la organización',
      editMember: 'Cambiar el rol de este usuario en la organización',
      confirmEditMemberTitle: 'Editar {name}',
      confirmDeleteMemberTitle: 'Excluir {name}',
      confirmDeleteMemberMsg: '¿Está seguro de que desea eliminar a este usuario de la lista de miembros de la organización {org}?',
      deleteMemberSuccess: 'El usuario {name} ha sido expulsado de la organización.',
      inviteEmail: 'Dirección de correo electrónico del usuario',
      inviteSuccess: 'Se ha enviado una invitación a {email}',
      memberConflict: 'Este usuario ya es miembro',
      departmentLabelTitle: 'Redacción del concepto "departamento"',
      departmentLabelHelp: 'Déjelo en blanco para mostrar "departamento". Complete para usar otro vocabulario como "servicio", "agencia", etc.',
      addDepartment: 'Crear {departmentLabel}',
      editDepartment: 'Editar {departmentLabel}',
      deleteDepartment: 'Eliminar {departmentLabel}',
      confirmEditDepartmentTitle: 'Editar {name}',
      confirmDeleteDepartmentTitle: 'Eliminar {name}',
      confirmDeleteDepartmentMsg: '¿Está seguro de que desea eliminar a {name} de su organización?',
      departmentIdInvalid: 'El identificador debe contener solo letras, números y espacios.',
      inviteLink: 'En caso de problema en la comunicación por correo electrónico puede enviar el enlace de confirmación a continuación por otro medio. Atención ! Corre el riesgo de insertar una dirección de correo electrónico incorrecta o no funcional en la base de datos de usuarios. Esta dirección de correo electrónico puede causar varios problemas posteriormente: cambio de contraseña, envío de alertas, etc.'
    },
    invitation: {
      title: 'Invitación validada',
      msgSameUser: 'Se ha aceptado su invitación para ser miembro de una organización. Puedes consultar <a href="{profileUrl}">tu perfil</a>.',
      msgDifferentUser: 'Esta invitación a ser miembro de una organización ha sido aceptada. Usted puede <a href="{loginUrl}">iniciar sesión</a> con la cuenta de invitado.'
    },
    avatar: {
      prepare: 'Prepara la imagen'
    },
    me: {
      noOrganization: 'No eres miembro de ninguna organización.',
      operations: 'Operaciones sensibles',
      deleteMyself: 'Eliminar esta cuenta',
      deleteMyselfAlert: 'Si elimina su cuenta, los datos asociados también serán eliminados y no podrán ser recuperados.',
      deleteMyselfCheck: 'marque esta casilla y haga clic en OK para confirmar la eliminación.'
    }
  },
  errors: {
    badEmail: 'La dirección de correo electrónico está vacía o mal formada.',
    maxCreatedOrgs: 'El usuario no puede crear más organizaciones. Límite alcanzado.',
    permissionDenied: 'Permisos insuficientes.',
    nonEmptyOrganization: 'Debe eliminar a otros miembros de esta organización.',
    userUnknown: 'Usuario desconocido.',
    orgaUnknown: 'Organización desconocida.',
    invitationConflict: 'Este usuario ya es miembro de la organización.',
    unknownRole: 'El rol {role} es desconocido.',
    serviceUnavailable: 'Servicio no disponible por mantenimiento.',
    badCredentials: 'Dirección de correo electrónico o contraseña inválida.',
    invalidToken: 'El token no es válido. Quizás haya expirado.',
    malformedPassword: 'La contraseña debe tener al menos 8 caracteres y contener al menos un número y un carácter en mayúscula.',
    noPasswordless: 'La autenticación sin contraseña no es aceptada por este servicio.',
    rateLimitAuth: 'Demasiados intentos en un corto intervalo. Por favor espere antes de intentarlo de nuevo.',
    invalidInvitationToken: 'El enlace de invitación que recibió no es válido.',
    expiredInvitationToken: 'El enlace de invitación que recibió ha caducado, ya no puede aceptar esta invitación.',
    maxNbMembers: 'La organización ya contiene el número máximo de miembros permitidos por sus cuotas.',
    unknownOAuthProvider: 'No se admite la identificación OAuth.',
    adminModeOnly: 'Funcionalidad reservada para superadministradores.'
  },
  mails: {
    creation: {
      subject: 'Bienvenido a {host}',
      text: `
Se ha realizado una solicitud de creación de cuenta desde {host} para esta dirección de correo electrónico. Para activar la cuenta, debe copiar la siguiente URL en un navegador. Esta URL es válida por 15 minutos.

{link}

Si tiene un problema con su cuenta o si no ha solicitado crear una cuenta en {host}, no dude en contactarnos en {contact}.
      `,
      htmlMsg: 'Se ha realizado una solicitud de creación de cuenta desde <a href="{origin}">{host}</a> para esta dirección de correo electrónico. Para confirmarlo, haga clic en el botón de abajo. El enlace es válido por 15 minutos.',
      htmlButton: 'Validar la creación de la cuenta',
      htmlAlternativeLink: 'Si el botón de arriba no funciona, puede copiar este enlace en la barra de direcciones de su navegador:',
      htmlCaption: 'Si tiene un problema con su cuenta o no ha solicitado iniciar sesión en <a href="{origin}">{host}</a>, no dudes en contactarnos en <a href="mailto:{contact}">{contact}</a>.'
    },
    login: {
      subject: 'Identificación en {host}',
      text: `
Se ha realizado una solicitud de identificación de {host}. Para confirmarlo, copie la siguiente URL en un navegador. Esta URL es válida por 15 minutos.

{link}

Si tiene un problema con su cuenta o si no ha solicitado iniciar sesión en {host}, no dude en contactarnos en {contact}.
      `,
      htmlMsg: 'Se ha realizado una solicitud de identificación desde <a href="{origin}">{host}</a>. Para confirmarlo, haga clic en el botón de abajo. El enlace es válido por 15 minutos.',
      htmlButton: 'Conectado a {host}',
      htmlAlternativeLink: 'Si el botón de arriba no funciona, puede copiar este enlace en la barra de direcciones de su navegador:',
      htmlCaption: 'Si tiene un problema con su cuenta o no ha solicitado iniciar sesión en <a href="{origin}">{host}</a>, no dudes en contactarnos en <a href="mailto:{contact}">{contact}</a>.'
    },
    noCreation: {
      subject: 'Fallo de autenticación en {host}',
      text: `
Se realizó una solicitud de identificación de {host}, pero fue rechazada porque esta dirección de correo electrónico es desconocida o no ha sido validada.

No dude en contactarnos en {contact}.
      `,
      htmlMsg: 'Se ha realizado una solicitud de identificación desde <a href="{origin}">{host}</a>, pero fue rechazado porque esta dirección de correo electrónico es desconocida o no ha sido validada.',
      htmlCaption: 'No dudes en contactarnos en <a href="mailto:{contact}">{contact}</a>.'
    },
    conflict: {
      subject: 'No se pudo crear una cuenta en {host}',
      text: `
Se realizó una solicitud de creación de cuenta desde {host}, pero fue rechazada porque esta dirección de correo electrónico ya está asociada con una cuenta.

No dude en contactarnos en {contact}.
      `,
      htmlMsg: 'Se ha realizado una solicitud de creación de cuenta desde <a href="{origin}">{host}</a>, pero fue rechazado porque esta dirección de correo electrónico ya está asociada a una cuenta.',
      htmlCaption: 'No dudes en contactarnos en <a href="mailto:{contact}">{contact}</a>.'
    },
    invitation: {
      subject: 'Únase a la organización {organization} en {host}',
      text: `
Un administrador de la organización {organization} lo ha invitado a unirse. Para aceptar esta invitación, copie la siguiente URL en un navegador. Esta URL es válida por 10 días.
Si aún no tiene una cuenta, se creará automáticamente.

{link}

Si tiene un problema con su cuenta o encuentra esta invitación sospechosa, no dude en contactarnos en {contact}.
      `,
      htmlMsg: `
Un administrador de la organización {organization} lo ha invitado a unirse. Para aceptar esta invitación, haga clic en el botón de abajo. El enlace es válido por 10 días.
Si aún no tiene una cuenta, se creará automáticamente.
      `,
      htmlButton: 'Aceptar la invitacion',
      htmlAlternativeLink: 'Si el botón de arriba no funciona, puede copiar este enlace en la barra de direcciones de su navegador:',
      htmlCaption: 'Si tiene un problema con su cuenta o encuentra esta invitación sospechosa, no dude en contactarnos en <a href="mailto:{contact}">{contact}</a>.'
    },
    action: {
      subject: 'Realice una acción en su cuenta el {host}',
      text: `
Se ha activado una acción solicitando confirmación por correo electrónico en esta dirección. Para validar esta acción, copie la siguiente URL en un navegador. Esta URL es válida por 15 minutos.

{link}

Si tiene un problema con su cuenta o encuentra este mensaje sospechoso, no dude en contactarnos en {contact}.
      `,
      htmlMsg: `
Se ha activado una acción solicitando confirmación por correo electrónico en esta dirección. Para validar esta acción, haga clic en el botón de abajo. El enlace es válido por 15 minutos.
      `,
      htmlButton: 'Validar',
      htmlAlternativeLink: 'Si el botón de arriba no funciona, puede copiar este enlace en la barra de direcciones de su navegador:',
      htmlCaption: 'Si tiene un problema con su cuenta o encuentra este mensaje sospechoso, no dude en contactarnos en <a href="mailto:{contact}">{contact}</a>.'
    }
  }
}
