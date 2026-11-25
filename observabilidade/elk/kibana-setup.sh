#!/bin/sh
# Prepara o Kibana sozinho: visão de dados dos logs da API e uma pesquisa salva
# com os erros e recusas. Roda uma vez quando a stack ELK sobe.
K=http://kibana:5601
H1='kbn-xsrf: true'
H2='Content-Type: application/json'

until curl -s "$K/api/status" | grep -q '"overall":{"level":"available"'; do
  echo "Esperando o Kibana ficar pronto..."
  sleep 5
done

curl -s -X POST "$K/api/data_views/data_view" -H "$H1" -H "$H2" -d '{
  "override": true,
  "data_view": {
    "id": "lafarina-logs",
    "title": "lafarina-logs-*",
    "name": "Logs da API La Farina",
    "timeFieldName": "@timestamp"
  }
}' > /dev/null

curl -s -X POST "$K/api/data_views/default" -H "$H1" -H "$H2" \
  -d '{"data_view_id": "lafarina-logs", "force": true}' > /dev/null

# Tema escuro, igual ao Grafana.
curl -s -X POST "$K/api/kibana/settings" -H "$H1" -H "$H2" \
  -d '{"changes": {"theme:darkMode": "enabled"}}' > /dev/null

curl -s -X POST "$K/api/saved_objects/search/lafarina-erros?overwrite=true" -H "$H1" -H "$H2" -d '{
  "attributes": {
    "title": "Erros e recusas da API",
    "columns": ["nivel", "metodo", "caminho", "status", "erro", "traceId"],
    "sort": [["@timestamp", "desc"]],
    "kibanaSavedObjectMeta": {
      "searchSourceJSON": "{\"query\":{\"language\":\"kuery\",\"query\":\"nivel : (error or warn)\"},\"filter\":[],\"indexRefName\":\"kibanaSavedObjectMeta.searchSourceJSON.index\"}"
    }
  },
  "references": [
    { "name": "kibanaSavedObjectMeta.searchSourceJSON.index", "type": "index-pattern", "id": "lafarina-logs" }
  ]
}' > /dev/null

echo "Kibana pronto: http://localhost:5601 (Discover > Erros e recusas da API)"
