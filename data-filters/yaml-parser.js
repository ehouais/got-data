define(['jsyaml'], function(jsyaml) {
    return {
        'yaml-parser': {
            process: function(yaml) {
                try {
                    return jsyaml.safeLoad(yaml);
                } catch (e) {
                    console.log(e);
                    return null;
                }
            }
        }
    }
});
