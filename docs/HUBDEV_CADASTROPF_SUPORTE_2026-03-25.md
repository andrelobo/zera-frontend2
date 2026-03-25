# HUBDEV cadastropf - retorno do suporte (2026-03-25)

Fonte: conversa direta com suporte do fornecedor em `2026-03-25`.

## Resumo executivo

- o endpoint indicado para enriquecimento de dados por CPF e:
  - `GET https://ws.hubdodesenvolvedor.com.br/v2/cadastropf/`
- objetivo de uso no ZERA:
  - autocomplete do cadastro de tomadores por CPF
- chamada minima informada pelo suporte:
  - `cpf` com apenas numeros
  - `token` com credencial valida

## Resposta do suporte

> Perfeito, André. segue o básico pra você testar rápido.
>
> Chamada de exemplo (método GET)
> * URL de exemplo:
> https://ws.hubdodesenvolvedor.com.br/v2/cadastropf/?cpf=72751462291&token=SEU_TOKEN
>
> * Parâmetros mínimos:
> * cpf = CPF da pessoa (somente números, sem pontos/traços)
> * token = seu token de acesso (substitua SEU_TOKEN)
>
> Observações importantes rápidas
> * Custo: 25 créditos por consulta com retorno positivo.
> * Limite: até 50 requisições a cada 10 segundos.
> * Alguns campos podem vir ofuscados por LGPD. Se precisar liberar campos completos, siga o procedimento LGPD no painel: https://legacy.hubdodesenvolvedor.com.br/sistema/?lgpd (preenchimento, assinatura gov.br e envio para contato@hubdodesenvolvedor.com.br). Liberação costuma levar ~1 dia útil.
> * Se quiser testar antes, temos exemplos e coleção no Postman.
>
> Link da coleção/documentação no Postman
> * https://www.postman.com/alcampagnani/workspace/hub-do-desenvolvedor/
>
> Quer que eu te passe um curl pronto de exemplo para rodar agora?

## Leitura operacional para o ZERA

- o suporte confirmou que o endpoint certo para enriquecimento de dados por CPF e o `cadastropf`
- custo operacional informado:
  - `25` creditos por consulta com retorno positivo
- limite operacional informado:
  - `50` requisicoes a cada `10` segundos
- risco importante:
  - alguns campos podem vir ofuscados por LGPD
- desbloqueio de campos completos:
  - depende do procedimento LGPD no portal deles
  - prazo informado: aproximadamente `1 dia util`

## Proximo passo recomendado

1. testar com saldo minimo controlado
2. validar na pratica quais campos chegam completos vs ofuscados
3. decidir se vale seguir com processo LGPD antes da integracao final no ZERA
