include .env

DOCKER:=docker
DOCKER_IMAGE_NAME="launch-order-bot"


docker-image:
	${DOCKER} buildx build --platform linux/amd64 -t ${DOCKER_IMAGE_NAME} .

docker-deploy: docker-image
	${DOCKER} login -u ${DOCKER_REGISTRY_USER} -p ${DOCKER_REGISTRY_PASSWORD} ${DOCKER_IMAGE_REGISTRY}
	${DOCKER} tag ${DOCKER_IMAGE_NAME} ${DOCKER_IMAGE_REGISTRY}/${DOCKER_IMAGE_NAME}:latest
	${DOCKER} push ${DOCKER_IMAGE_REGISTRY}/${DOCKER_IMAGE_NAME}:latest