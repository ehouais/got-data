define(['xlsx'], function(XLSX) {
    return {
        'excel-parser': {
            process: function(excel) {
                return XLSX.read(excel, {type: 'binary'});
            }
        }
    }
});
