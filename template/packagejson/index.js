import ejs from 'ejs';
import packageTemplate from './package.json.ejs?raw';


export default context => {
    return {
        createFileMap: () => {
            return {
                '/package.json': () => ejs.render(packageTemplate, context)
            };
        }
    };
}
