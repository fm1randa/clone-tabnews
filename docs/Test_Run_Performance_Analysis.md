# Análise de Performance das Execuções de Testes

## Comando: `npm run services:down && time npm test`

| Execução | Tempo Real (s) |
| -------- | -------------- |
| 1        | 12.238         |
| 2        | 7.495          |
| 3        | 7.538          |
| 4        | 7.609          |
| 5        | 7.697          |
| 6        | 7.604          |
| 7        | 7.279          |
| 8        | 7.171          |
| 9        | 7.212          |
| 10       | 7.356          |

## Análise Estatística

- **Média**: 7.920s
- **Mediana**: 7.497s
- **Mínimo**: 7.171s (Execução #8)
- **Máximo**: 12.238s (Execução #1)
- **Amplitude**: 5.067s

_Nota: A Execução #1 aparenta ser um outlier (54% mais lenta que a média das demais execuções), provavelmente devido à configuração inicial/cold start._

## Observações

- **Primeira execução** é significativamente mais lenta (12.238s vs ~7.4s de média nas execuções subsequentes)
- **Execuções subsequentes** são relativamente consistentes (variação de 7.17s - 7.70s, ~7% de variância)
- **Performance estável** após aquecimento indica boa confiabilidade dos testes

---

# Melhoria de Performance: maxTimeout Reduzido para 1000ms

## Novos Resultados dos Testes (com maxTimeout = 1000ms)

| Execução | Tempo Real (s) |
| -------- | -------------- |
| 1        | 7.828          |
| 2        | 7.477          |
| 3        | 7.958          |
| 4        | 7.279          |
| 5        | 7.616          |
| 6        | 7.736          |
| 7        | 7.470          |
| 8        | 7.561          |
| 9        | 7.560          |
| 10       | 7.463          |

## Análise Estatística (maxTimeout = 1000ms)

- **Média**: 7.595s
- **Mediana**: 7.569s
- **Mínimo**: 7.279s (Execução #4)
- **Máximo**: 7.958s (Execução #3)
- **Amplitude**: 0.679s

## 📊 Comparação de Performance

### Baseline (Execuções originais 2-10, excluindo cold start)

- **Média**: 7.440s
- **Mediana**: 7.495s
- **Desvio Padrão**: 0.183s

### Com maxTimeout = 1000ms (Todas as execuções, sem cold start)

- **Média**: 7.595s
- **Mediana**: 7.569s
- **Desvio Padrão**: 0.201s

### Impacto na Performance

| Métrica           | Baseline | maxTimeout=1000ms | Mudança | Porcentagem                  |
| ----------------- | -------- | ----------------- | ------- | ---------------------------- |
| **Média**         | 7.440s   | 7.595s            | +0.155s | **+2.08% mais lento** ⚠️     |
| **Mediana**       | 7.495s   | 7.569s            | +0.074s | **+0.99% mais lento** ⚠️     |
| **Desvio Padrão** | 0.183s   | 0.201s            | +0.018s | **+9.84% menos consistente** |

## 🔍 Principais Descobertas

### ⚠️ Resultados Inesperados

- **Sem melhoria de performance**: Reduzir o maxTimeout para 1000ms não melhorou o tempo de execução dos testes
- **Levemente mais lento**: A versão otimizada executa ~2% mais devagar em média
- **Sem problema de cold start**: A Execução #1 nos novos testes (7.828s) é similar às outras execuções, diferente do baseline original onde a Execução #1 era 12.238s

### 💡 Possíveis Explicações

1. **Impacto do overhead**: O mecanismo de retry com timeout mais curto pode introduzir um leve overhead
2. **Condições diferentes**: O segundo conjunto de testes pode ter sido executado sob diferentes condições de carga do sistema
3. **Margem de erro**: A diferença é pequena (~2%) e pode estar dentro da variância normal

### ✅ Nota Positiva

- **Cold start eliminado**: A nova implementação não apresenta a desaceleração dramática na primeira execução (12.238s → 7.828s)
- **Mais previsível**: Todas as execuções agora estão consistentemente na faixa de 7.3-8.0s desde o início

---

# Otimização: Remoção do wait-for-postgres

## Novos Resultados dos Testes (sem wait-for-postgres)

| Execução | Tempo Real (s) |
| -------- | -------------- |
| 1        | 6.666          |
| 2        | 5.725          |
| 3        | 6.015          |
| 4        | 6.109          |
| 5        | 5.895          |
| 6        | 5.967          |
| 7        | 6.213          |
| 8        | 6.216          |
| 9        | 5.639          |
| 10       | 5.673          |

## Análise Estatística (sem wait-for-postgres)

- **Média**: 6.012s
- **Mediana**: 5.991s
- **Mínimo**: 5.639s (Execução #9)
- **Máximo**: 6.666s (Execução #1)
- **Amplitude**: 1.027s

## 📊 Comparação de Performance

### Baseline Original (Execuções 2-10, com wait-for-postgres)

- **Média**: 7.440s
- **Mediana**: 7.495s
- **Desvio Padrão**: 0.183s

### Com maxTimeout = 1000ms

- **Média**: 7.595s
- **Mediana**: 7.569s
- **Desvio Padrão**: 0.201s

### Sem wait-for-postgres (Todas as execuções)

- **Média**: 6.012s
- **Mediana**: 5.991s
- **Desvio Padrão**: 0.288s

### Impacto na Performance

| Métrica           | Baseline | Sem wait-for-postgres | Mudança | Porcentagem                      |
| ----------------- | -------- | --------------------- | ------- | -------------------------------- |
| **Média**         | 7.440s   | 6.012s                | -1.428s | **-19.19% mais rápido** ✅       |
| **Mediana**       | 7.495s   | 5.991s                | -1.504s | **-20.07% mais rápido** ✅       |
| **Desvio Padrão** | 0.183s   | 0.288s                | +0.105s | **+57.38% menos consistente** ⚠️ |

## 🔍 Principais Descobertas

### ✅ Melhoria Significativa

- **Ganho real de performance**: Remover o wait-for-postgres resultou em ~20% de redução no tempo de execução
- **1.4 segundos mais rápido**: Em média, os testes agora executam em 6.0s vs 7.4s anteriormente
- **Primeira execução normalizada**: A Execução #1 (6.666s) não mostra o problema de cold start dramático

### ⚠️ Trade-off de Consistência

- **Maior variabilidade**: O desvio padrão aumentou de 0.183s para 0.288s
- **Amplitude maior**: Variação de 5.6s a 6.7s (vs 7.2s a 7.7s anteriormente)
- **Ainda aceitável**: A variação de ~1s ainda é razoável para testes de integração

### 💡 Conclusão

Remover o wait-for-postgres foi a **otimização mais efetiva**, proporcionando:

- ✅ **19-20% de ganho de performance**
- ✅ **Execuções consistentemente abaixo de 7s**
- ⚠️ **Leve aumento na variabilidade** (trade-off aceitável)

Esta mudança representa uma melhoria significativa comparada ao ajuste do maxTimeout, que não trouxe benefícios mensuráveis.
