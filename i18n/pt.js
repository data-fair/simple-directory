module.exports = {
  errors: {
    badEmail: 'O endereço de email está vazio ou está incorreto.',
    maxCreatedOrgs: `O usuário não pode criar mais organizações. Limite atingido.`,
    permissionDenied: 'Permissões insuficientes.',
    nonEmptyOrganization: `Você deve remover outros membros desta organização.`,
    userUnknown: 'Usuário desconhecido.',
    orgaUnknown: 'Organização desconhecida.',
    invitationConflict: 'Este usuário já é membro da organização.',
    unknownRole: 'A função {role} é desconhecida.',
    serviceUnavailable: 'Serviço indisponível devido à manutenção.',
    badCredentials: `Endereço de email ou senha inválidos.`,
    invalidToken: `O token não é válido. Talvez tenha expirado.`,
    malformedPassword: 'A senha deve ter pelo menos 8 caracteres e conter pelo menos um número e um caractere maiúsculo.',
    noPasswordless: `A autenticação sem senha não é aceita por este serviço.`,
    rateLimitAuth: `Muitas tentativas em um curto intervalo. Aguarde antes de tentar novamente.`
  }
}
