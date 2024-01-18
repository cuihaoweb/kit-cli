#!/bin/bash

IMAGE_NAME="app-name:1.0"
CONTAINER_NAME="my-app-name"

clean() {
    if [[ "$(docker images -q $IMAGE_NAME 2> /dev/null)" != "" ]]; then
        echo "$IMAGE_NAME exist, and deleting $IMAGE_NAME"
        # 如果存在同名镜像，检查是否有同名的容器在运行
        if [[ "$(docker ps -aq -f name=$CONTAINER_NAME 2> /dev/null)" != "" ]]; then
            # 如果有同名容器在运行，停止并删除容器
            echo "$CONTAINER_NAME exist, and deleting $CONTAINER_NAME"
            docker stop $CONTAINER_NAME
            docker rm $CONTAINER_NAME
        fi
        # 删除同名镜像
        docker rmi $IMAGE_NAME
    fi
    # 删除悬空镜像
    if [[ "$(docker images -f "dangling=true" -q 2> /dev/null)" != "" ]]; then
        echo "cleaning dangling images"
        docker rmi $(docker images -f "dangling=true" -q) 2> /dev/null
    fi
}

buildImage() {
    echo "staring build $IMAGE_NAME image"
    docker build -t $IMAGE_NAME .
}

startImage() {
    echo "staring build image $IMAGE_NAME"
    docker run \
        -d \
        --restart=always \
        --name $CONTAINER_NAME \
        -u root \
        -p 3000:3000 \
        --restart=always \
        $IMAGE_NAME
}

main() {
    action="$1"
    echo "$action"

    if [ "$action" = "clean" ]; then
        clean
    elif [ "$action" = "buildImage" ]; then
        buildImage
    elif [ "$action" = "startImage" ]; then
        startImage
    fi
}

main "$@"
