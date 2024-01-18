import ejs from 'ejs';
import droneTemplate from './.drone.yml?raw';
import buildTemplate from './build.sh?raw';
import DockerfileTemplate from './Dockerfile?raw';
import JenkinsfileTemplate from './Jenkinsfile?raw';


export default context => {
    return {
        name: 'CI-CD',
        createFileMap: () => {
            return {
                '/script/build.sh': () => buildTemplate,
                '/.drone.yml': () => droneTemplate,
                '/Dockerfile': () => DockerfileTemplate,
                '/Jenkinsfile': () => JenkinsfileTemplate,
            };
        },
        getDeps: () => [],
        getDevDeps: () => []
    };
}
