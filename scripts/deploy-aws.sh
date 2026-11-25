#!/usr/bin/env bash
# Publica o La Farina na AWS: uma máquina EC2 (t3.micro) na região de São Paulo
# rodando dois containers Docker, a API (porta 3000) e o site (porta 80).
#
# Rode no AWS CloudShell (o terminal do console da AWS, que já vem logado):
#   curl -sL https://raw.githubusercontent.com/HeberMacedo/La-Farina/main/scripts/deploy-aws.sh | bash
# Outras ações:
#   ... | bash -s status      mostra os endereços
#   ... | bash -s atualizar   recria a máquina com a versão mais nova do GitHub
#   ... | bash -s remover     apaga a máquina e a regra de firewall (zera o custo)
set -euo pipefail

ACAO="${1:-publicar}"
export AWS_DEFAULT_REGION="${REGIAO:-sa-east-1}"
NOME="la-farina"
TIPO="${TIPO:-t3.micro}"

instancia() {
  aws ec2 describe-instances \
    --filters "Name=tag:Name,Values=$NOME" "Name=instance-state-name,Values=pending,running,stopping,stopped" \
    --query 'Reservations[].Instances[].InstanceId' --output text
}

endereco() {
  aws ec2 describe-instances --instance-ids "$1" \
    --query 'Reservations[0].Instances[0].PublicDnsName' --output text
}

mostrar() {
  local dns
  dns="$(endereco "$1")"
  echo "  Site: http://$dns"
  echo "  API:  http://$dns:3000/health   (métricas em /metrics)"
}

remover_instancia() {
  local id
  id="$(instancia)"
  if [ -n "$id" ]; then
    echo "Apagando a máquina $id..."
    aws ec2 terminate-instances --instance-ids $id >/dev/null
    aws ec2 wait instance-terminated --instance-ids $id
  fi
}

case "$ACAO" in
  status)
    id="$(instancia)"
    if [ -z "$id" ]; then echo "Nada publicado na região $AWS_DEFAULT_REGION."; else mostrar "$id"; fi
    exit 0
    ;;
  remover)
    remover_instancia
    sg="$(aws ec2 describe-security-groups --filters "Name=group-name,Values=$NOME" \
      --query 'SecurityGroups[0].GroupId' --output text 2>/dev/null || true)"
    if [ -n "$sg" ] && [ "$sg" != "None" ]; then aws ec2 delete-security-group --group-id "$sg"; fi
    echo "Tudo removido. Não fica nada rodando nem cobrando."
    exit 0
    ;;
  atualizar)
    remover_instancia
    ;;
  publicar)
    id="$(instancia)"
    if [ -n "$id" ]; then
      echo "O La Farina já está publicado:"
      mostrar "$id"
      echo "Para publicar a versão mais nova do GitHub, rode com: bash -s atualizar"
      exit 0
    fi
    ;;
  *)
    echo "Ação desconhecida: $ACAO (use publicar, status, atualizar ou remover)"
    exit 1
    ;;
esac

echo "==> Região: $AWS_DEFAULT_REGION (São Paulo) | máquina: $TIPO"

vpc="$(aws ec2 describe-vpcs --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId' --output text)"
if [ "$vpc" = "None" ]; then
  aws ec2 create-default-vpc >/dev/null
  vpc="$(aws ec2 describe-vpcs --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId' --output text)"
fi

echo "==> Firewall: libera só as portas 80 (site) e 3000 (API)"
sg="$(aws ec2 describe-security-groups --filters "Name=group-name,Values=$NOME" "Name=vpc-id,Values=$vpc" \
  --query 'SecurityGroups[0].GroupId' --output text)"
if [ "$sg" = "None" ]; then
  sg="$(aws ec2 create-security-group --group-name "$NOME" --vpc-id "$vpc" \
    --description "La Farina: site (80) e API (3000)" --query GroupId --output text)"
  aws ec2 authorize-security-group-ingress --group-id "$sg" --ip-permissions \
    'IpProtocol=tcp,FromPort=80,ToPort=80,IpRanges=[{CidrIp=0.0.0.0/0}]' \
    'IpProtocol=tcp,FromPort=3000,ToPort=3000,IpRanges=[{CidrIp=0.0.0.0/0}]' >/dev/null
fi

ami="$(aws ssm get-parameter --name /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64 \
  --query Parameter.Value --output text)"

# Roteiro que a própria máquina executa ao ligar: instala o Docker, baixa o
# código do GitHub, monta as imagens e sobe a API e o site.
roteiro="$(mktemp)"
cat > "$roteiro" <<'BOOT'
#!/bin/bash
exec > /var/log/la-farina.log 2>&1
set -eux
# 2 GB de memória extra (swap): o build do site precisa de mais que 1 GB.
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile
  echo '/swapfile swap swap defaults 0 0' >> /etc/fstab
fi
swapon /swapfile || true
dnf install -y docker git
systemctl enable --now docker
rm -rf /opt/la-farina
git clone --depth 1 https://github.com/HeberMacedo/La-Farina.git /opt/la-farina
cd /opt/la-farina
docker network create la-farina || true
docker build --target api -t la-farina-api .
docker rm -f api web || true
docker run -d --name api --network la-farina --restart unless-stopped \
  -p 3000:3000 -e NODE_ENV=production la-farina-api
docker build -t la-farina-web --build-arg VUE_APP_API_BASE_URL=/api --build-arg VUE_APP_PUBLIC_PATH=/ .
docker run -d --name web --network la-farina --restart unless-stopped -p 80:80 \
  -v /opt/la-farina/deploy/aws/nginx.conf:/etc/nginx/conf.d/default.conf:ro la-farina-web
echo "La Farina no ar"
BOOT

echo "==> Criando a máquina EC2"
id="$(aws ec2 run-instances --image-id "$ami" --instance-type "$TIPO" --security-group-ids "$sg" \
  --user-data "file://$roteiro" --metadata-options HttpTokens=required \
  --block-device-mappings 'DeviceName=/dev/xvda,Ebs={VolumeSize=20,VolumeType=gp3}' \
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$NOME}]" \
  --query 'Instances[0].InstanceId' --output text)"
aws ec2 wait instance-running --instance-ids "$id"
dns="$(endereco "$id")"

echo "==> Máquina $id ligada. Agora ela monta os containers (uns 5 a 10 minutos)..."
for _ in $(seq 1 90); do
  if curl -sf -m 5 "http://$dns:3000/health" >/dev/null && curl -sf -m 5 "http://$dns/" >/dev/null; then
    echo "==> No ar!"
    mostrar "$id"
    exit 0
  fi
  sleep 10
done
echo "Ainda montando. Os endereços abaixo devem responder em alguns minutos:"
mostrar "$id"
