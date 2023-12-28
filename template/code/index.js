export default (context) => {
    return {
        getCodePath: () => {
            const {frame, mode} = context;
            return `${frame}-${mode}`;
        }
    }
}
