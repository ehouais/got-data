define([], function() {
    return function($container) {
        var $title = document.createElement('div'),
            $viz = document.createElement('div'),
            loadCss = (function() {
                var loaded = [];
                return function(url) {
                    if (loaded.indexOf(url) == -1) {
                        var link = document.createElement('link');
                        link.href = url;
                        link.type = 'text/css';
                        link.rel = 'stylesheet';
                        document.getElementsByTagName('head')[0].appendChild(link);
                        loaded.push(url);
                    }
                };
            })(),
            resizableSvg = function($svg) {
                var width = parseInt($svg.getAttribute('width')),
                    height = parseInt($svg.getAttribute('height'));
                
                $svg.setAttribute('width', '100%');
                $svg.setAttribute('height', '100%');
                $svg.setAttribute('viewBox', '0 0 '+width+' '+height);
            },
            resize,
            previous,
            setFontSize = function() {
                $title.style.fontSize = $container.offsetHeight/20+'px';
            };

        $container.style.display = 'flex';
        $container.style.flexDirection = 'column';
        //$title.classList.add('title');
        $title.style.textAlign = 'center';
        $container.appendChild($title);
        //$viz.classList.add('viz');
        $viz.style.flex = 1;
        $viz.style.overflow = 'hidden';
        $container.appendChild($viz);

        return {
            render: function(vizType, data, title) {
                if (title) {
                    $title.textContent = title;
                }
                if (previous) $viz.classList.remove(previous);
                $viz.classList.add(previous = vizType);
                if (['vbars', 'hbars', 'pie', 'lines', 'diagram', 'map'].indexOf(vizType) != -1) {
                    var path = '/assets/charts/0.3.2';
                    require.config({
                        baseUrl: path,
                        paths: {
                            d3: '/assets/d3/4.2.8/d3.min',
                            leaflet: '/assets/leaflet/1.0.3/leaflet',
                            'snap.svg': '/assets/snap.svg/0.4.1/snap.svg-min'
                        },
                        shim: {
                            leaflet: {exports: 'L'}
                        }
                    });
                    $viz.innerHTML = '';
                    ({
                        hbars: [path+'/condensed-font.css', path+'/hbars/default.css'],
                        lines: [path+'/condensed-font.css', path+'/lines/default.css'],
                        map: ['/assets/leaflet/1.0.3/leaflet.css', path+'/map/default.css'],
                        pie: [path+'/condensed-font.css', path+'/pie/default.css'],
                        vbars: [path+'/condensed-font.css', path+'/vbars/default.css']
                    })[vizType].forEach(function(url) {
                        loadCss(url);
                    });
                    require([vizType+'/chart'], function(Chart) {
                        var chart = Chart($viz, {margin: 0.05});
                        chart.update(data);
                        resize = function() { chart.resize(); };
                    });
                } else if (vizType == 'object-tree') {
                    require.config({
                        paths: {
                            jsontree: '/assets/jsontree/0.2.1/jsontree.min'
                        },
                        shim: {
                            jsontree: {exports: 'JSONTree'}
                        }
                    });
                    loadCss('/assets/object-tree.css');
                    require(['jsontree'], function(JSONTree) {
                        $viz.innerHTML = JSONTree.create(data);
                    })
                } else if (vizType == 'table') {
                    require.config({
                        paths: {
                            tablesort: '/assets/tablesort/5.0.0/tablesort.min'
                        },
                        shim: {
                            tablesort: {exports: 'Tablesort'}
                        }
                    });
                    loadCss('/assets/table.css');
                    require(['tablesort'], function(Tablesort) {
                        var $table = document.createElement('table'),
                            $tbody = document.createElement('tbody'),
                            $row = function(row, header) {
                                return row.reduce(function($tr, value) {
                                    var $td = document.createElement(header ? 'th' : 'td');
                                    $td.textContent = value;
                                    $tr.appendChild($td);
                                    return $tr;
                                }, document.createElement('tr'))
                            };

                        if (data.cols) {
                            $table.appendChild($row(data.cols.map(function(col) {
                                return col.label;
                            }), true));
                            data = data.rows;
                        }
                        data.forEach(function(row) {
                            $tbody.appendChild($row(row));
                        });
                        $table.appendChild($tbody);
                        $viz.innerHTML = '';
                        $viz.appendChild($table);
                        new Tablesort($table);
                    })
                } else if (vizType == 'text') {
                    loadCss('/assets/text.css');
                    $viz.textContent = data;
                } else if (vizType == 'uml-sequence') {
                    require.config({
                        baseUrl: path,
                        paths: {
                            webfont: '/assets/webfont/1.6.28/webfontloader',
                            'snap.svg': '/assets/snap.svg/0.4.1/snap.svg-min',
                            underscore: '/assets/underscore/1.8.3/underscore-min',
                            'sequence-diagram': '/assets/js-sequence-diagrams/2.0.1/sequence-diagram'
                        },
                        shim: {
                            //webfont: {exports: 'WebFont'},
                            underscore: {exports: '_'},
                            'sequence-diagram': {exports: 'Diagram', deps: ['webfont', 'snap.svg', 'underscore']},
                        }
                    });
                    require(['sequence-diagram'], function(Diagram) {
                        var diagram = Diagram.parse(data);
                        $viz.innerHTML = '';
                        $viz.setAttribute('id', 'sequence');
                        diagram.drawSVG('sequence', {theme: 'snapSimple'});
                        resizableSvg($viz.firstChild);
                    });
                } else if (vizType == 'flowchart') {
                    require.config({
                        baseUrl: path,
                        paths: {
                            Raphael: '/assets/raphael/2.2.7/raphael.min',
                            flowchart: '/assets/flowchart/1.7.0/flowchart-latest'
                        },
                        shim: {
                            //Raphael: {exports: 'Raphael'},
                            flowchart: {exports: 'flowchart'},
                        }
                    });
                    require(['flowchart'], function(flowchart) {
                        var diagram = flowchart.parse(data);
                        $viz.innerHTML = '';
                        $viz.setAttribute('id', 'flowchart');
                        diagram.drawSVG('flowchart');
                        resizableSvg($viz.firstChild);
                    });
                } else if (vizType == 'graph') {
                    require.config({
                        baseUrl: path,
                        paths: {
                            d3: '/assets/d3/4.2.8/d3.min',
                            'dot-checker': '/assets/graph-viz-d3/0.9.50/dot-checker',
                            'layout-worker': '/assets/graph-viz-d3/0.9.50/layout-worker',
                            worker: '/assets/requirejs-web-workers/1.0.1/worker',
                            renderer: '/assets/graph-viz-d3/0.9.50/renderer'
                        }
                    });
                    require(['renderer'], function(renderer) {
                        $viz.innerHTML = '';
                        $viz.setAttribute('id', 'graph');
                        renderer.init('#graph');
                        renderer.renderHandler(function() {
                            resizableSvg($viz.firstChild);
                        });
                        renderer.render(data);
                    });
                }
                setFontSize();
            },
            resize: function() {
                setFontSize();
                resize && resize();
            }
        };
    };
});
