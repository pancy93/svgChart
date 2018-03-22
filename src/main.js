const CHART_TYPE=['line','bar'];

/**
 * 基础图标类。
 * @param {}
 */
class XChart{
    constructor({
        parent="",
        height=240,
        title="title",
        subtitle="subtitle",
        data={},
        type="",
        is_navigable=0,
    }){
        if(Object.getPrototypeOf(this) === XChart.prototype){
            if(arguments[0].type==='bar'){
                return new Barchart(arguments[0]);
            }else if(arguments[0].type==="line"){
                return new Linechart(arguments[0]);
            }else if(arguments[0].type==="percentage"){

            }else if(arguments[0].type==="heatmap"){

            }
        }
        this.parent=document.querySelector(parent);
        this.title=title;
        this.subtitle=subtitle;
        this.data=data;
        this.base_height=height;
		this.height=height - 40;
		this.translate_x=60;
        this.translate_y=10;
        this.is_navigable=is_navigable;
        if(this.is_navigable){
            this.current_index=0;
        }
    }

    //浏览器窗口大小改变时重绘svg
    bindWindowEvents(){
        window.addEventListener('resize',()=>this.refresh());
    }

    //初始化
    setUp(){
        this.bindWindowEvents();
        this.refresh();
    }

    //重绘
    refresh(){
        this.setWidth();
        this.setupContainer();
        this.setupComponent();

        this.setupUtils();
        this.getAxisValue();
        this.drawChartComponent();

        if(this.is_navigable){
            console.log('nav');
            this.setupNavigation();
        }
    }

    //设置宽度
    setWidth(){
        this.base_width=this.parent.offsetWidth;
		this.width=this.base_width-this.translate_x * 2;
    }

    //初始化图表区域
    setupContainer(){
        //图表区域结构为.chart-container->.xchartwrapper->.graph-stats-container
        this.chartContainer=$$tool.createEl('div', {
			class: 'chart-container',
			innerHTML: `<h6 class="title" style="margin-top: 15px;">${this.title}</h6>
				<h6 class="sub-title uppercase">${this.subtitle}</h6>
				<div class="xchartwrapper graphics"></div>
				<div class="graph-stats-container"></div>`
        });
        
        this.parent.innerHTML="";
        this.parent.appendChild(this.chartContainer);

        this.chartWrapper=this.chartContainer.querySelector(".xchartwrapper");

        this.svg = $$tool.createSVG('svg', {
			className: 'chart',
			width: this.base_width,
			height: this.base_height
        });
        this.chartWrapper.appendChild(this.svg);
        
        this.drawArea=$$tool.createSVG("g", {
			className: this.type+'chart',
			transform: `translate(${this.translate_x}, ${this.translate_y})`
        });
        this.svg.appendChild(this.drawArea);
        
        this.stats_wrapper=this.chartContainer.querySelector('.graph-stats-container');
    }

    // setupChartArea(){}
    // setupDrawArea(){}

    setupComponent() {
		this.svg_units_group = $$tool.createSVG('g', {
			className: 'data-points',
        });
        this.drawArea.appendChild(this.svg_units_group);
    }
    
    

    //一些工具函数
    setupUtils(){
        this.draw={
            "bar":(x,y,args,color,index)=>{
                //单组bar的宽度
                var totalWidth=this.AxisUnitWidth-args.space_width;
                //起点偏移
                var start_x=x-totalWidth/2;
                //单条bar的宽度
                var width = totalWidth / args.num_of_datasets;
                var current_x =start_x + width*index;

                return $$tool.createSVG('rect',{
                    className: `bar mini fill ${color}`,
					x: current_x,
					y: this.height-y,
					width: width,
					height: y
                });
            },
            "line":(x,y,args,color)=>{
                return $$tool.createSVG('circle',{
                    className: `fill ${color}`,
                    cx:x,
                    cy:this.height-y,
                    r:args.radius
                })
            }
        };
        this.animate={
            "bar":(bar,newy,args)=>{
                return [bar,{height:this.height-newy,y:newy},300,"easein"];
            },
            "dot":(bar,newy)=>{

            }
        }
    }
}

/**
 * 基于XChart扩展的不同类型图表
 */
class AxisChart extends XChart{
    constructor(args){
        super(args);
        this.axisX=this.data.labels;
        this.axisY=this.data.datasets;


        this.colors = ['lightblue', 'purple', 'blue', 'green', 'lightgreen','yellow', 'orange', 'red'];
        
        
    }

    //获取2维坐标点
    getAxisValue(){
        this.getXval();
        this.getYval();
        this.setUnitArgs();
    }

    getXval(){
        this.setXoffsetAndAxisUnitWidth();
        this.xAxisValues=this.axisX.map((v,i)=>{
            return parseFloat(this.Xoffset+i*this.AxisUnitWidth).toFixed(2);
        });
    }

    //y坐标数据,定义this.yUpperLimit，this.yParts，this.multiplier，this.yAxisValues
    getYval(){
        var allYval=[];
        this.axisY.map((v)=>{
            allYval=allYval.concat(v.values);
        });
        //...为扩展运算符
        var YmaxVal=parseInt(Math.max(...allYval));
        console.log(allYval,YmaxVal);
        
        if((YmaxVal+"").length <= 1){
            //坐标上限为个位数
            this.yUpperLimit=10;
            this.yParts=5;
        }else{
            var multiplier = Math.pow(10, ((YmaxVal+"").length - 1));
			var significant = Math.ceil(YmaxVal/multiplier);
			if(significant % 2 !== 0) significant++;
			var parts = (significant < 5) ? significant : significant/2;
            this.yUpperLimit=significant * multiplier;
            this.yParts=parts;
        }

        this.multiplier = this.height / this.yUpperLimit;

        this.yAxisValues=[];
		for(var i = 0; i <=this.yParts; i++){
			this.yAxisValues.push(this.yUpperLimit / this.yParts * i);
		}
    }

    //绘制图表的横纵坐标组件
    drawChartComponent(){
        this.drawXaxis();
        this.drawYaxis();
        this.drawChart();
        this.drawYspecifics();
    }

    drawXaxis(){
        this.xAxisGroup.setAttribute('transform', `translate(0,-9)`);
        this.axisX.map((v,i)=>{
            //console.log(v.length * 8);
            var line=$$tool.createSVG('line',{
                x1: 0,
				x2: 0,
				y1: 0,
				y2: this.height+15
            });

            var text=$$tool.createSVG('text',{
                className: 'x-axis-text',
				x: 0,
				y: this.height+25,
				dy:'.71em',
				innerHTML: v
            });

            var xlevel=$$tool.createSVG('g',{
                transform:  `translate(${ this.xAxisValues[i] }, 0)`
            });

            xlevel.appendChild(line);
            xlevel.appendChild(text);
            this.xAxisGroup.appendChild(xlevel);
        })
    }

    drawYaxis(){
        this.yAxisValues.map((v)=>{
            var ylevel=$$tool.createSVG('g',{
                className:'ylevel',
                transform: `translate(0, ${this.height - v*this.multiplier })`
            });

            var line=$$tool.createSVG('line',{
                x1:-6,
                x2:this.width+6,
                y1:0,
                y2:0
            });

            var text=$$tool.createSVG('text',{
                className: 'y-axis-text',
                dy: '.32em',
                x:-9,
                y:0,
                innerHTML: v+""
            })

            ylevel.appendChild(line);
            ylevel.appendChild(text);
            this.yAxisGroup.appendChild(ylevel);
        })
    }

    //根据y数据绘制图形
    drawChart(){
        var ydata=[];
        this.axisY.map((d,i)=>{
            //先不绘制，等更新后画
            ydata.push({values:d.values});
            d.svgUnits=[];
            this.setUnit(d.values,d.color||this.colors[i],i);
            //只有line表需要链接路径
            if(this.drawPath){
                this.drawPath(d,d.color||this.colors[i]);
            }
        })

        
    }

    //根据颜色设定指定组数据的位置
    setUnit(vals,color,i){
        //console.log(i);
        //this.svg_units_group.textContent='';
        var d=this.unitArgs;

        for(var c=0;c<this.axisX.length;c++){
            var unitData=this.draw[d.type](this.xAxisValues[c],vals[c]*this.multiplier,d.args,color,i);
            this.svg_units_group.appendChild(unitData);
            this.axisY[i].svgUnits.push(unitData);
        }
    }

    // //动态更新数据，可作为api调用
    // updateDataValues(newD){
    //     this.axisY.map((d,i)=>{
    //         d.values=newD[i].values;
    //     });

    //     var oldlimit=this.yUpperLimit;
    //     this.getYval();
    //     if(oldlimit!==this.yUpperLimit){
    //         //重画y轴
    //         this.drawYaxis();
    //     }

    //     var elToAnimate=[];
    //     this.axisY.map((d,i)=>{
    //         d.tops=d.values.map((v,j)=>{return parseFloat(this.height-v*this.multiplier).toFixed(2)});
    //         d.svgUnits.map((unit,index)=>{
    //             elToAnimate.push(this.animate[this.unitArgs.type](
    //                 {unit:unit,array:d.svgUnits,index:index},
    //                 d.tops[index],
    //                 {newheight:this.height-d.tops[index]}
    //             ));
    //         });
    //     });

        
    // }

    //x，y坐标轴与标志线组件
    setupComponent(){
        this.xAxisGroup=$$tool.createSVG('g',{className:"x axis"});
        this.drawArea.appendChild(this.xAxisGroup);
        this.yAxisGroup=$$tool.createSVG('g',{className:"y axis"});
        this.drawArea.appendChild(this.yAxisGroup);
        this.yAxisLines=$$tool.createSVG('g',{className:"y specificlines"});
        this.drawArea.appendChild(this.yAxisLines);
        super.setupComponent();
    }
}


class Barchart extends AxisChart{
    constructor(args){
        super(args);
        this.type="bar";
        this.setUp();
        console.log(this);
    }

    //横坐标间隔
    setXoffsetAndAxisUnitWidth(){
        this.Xoffset=this.AxisUnitWidth=this.width/(this.axisX.length+1);
    }

    setUnitArgs(){
        this.unitArgs={
            type: 'bar',
			args: {
				// More intelligent width setting
				space_width: this.AxisUnitWidth/2,
				num_of_datasets: this.axisY.length
			}
        }
    }

    setupNavigation(){
        var that=this;
        setTimeout(()=>{
            let els=document.querySelectorAll('.chart-container rect');
            for(let i=0;i<els.length;i++){
                els[i].addEventListener("click",(e)=>{
                    let e_select=new Event('data-selected');
                    e_select.index=i;
                    //console.log(els[i].class);
                    //els[i]['class']+=' nav-active';
                    
                    that.parent.dispatchEvent(e_select);
                });
            }
        },500);
    }
}

class Linechart extends AxisChart{
    constructor(args){
        super(args);
        this.type="line";
        this.setUp();
        console.log(this);
    }

    //横坐标间隔
    setXoffsetAndAxisUnitWidth(){
        this.AxisUnitWidth=this.width/(this.axisX.length-1);
        this.Xoffset=0;
    }

    setUnitArgs(){
        this.unitArgs={
            type: 'line',
			args: {
				radius:4
			}
        }
    }

    drawPath(data,color){
        var pointlist=data.values.map((v,i)=>{
            return this.xAxisValues[i]+','+(this.height-v*this.multiplier);
        });
        var path_str='M'+pointlist.join('L');

        data.path=$$tool.createSVG('path',{
            className: `stroke ${color}`,
			d: path_str
        });
        this.svg_units_group.appendChild(data.path);
    }

    setupNavigation(){
        var that=this;
        setTimeout(()=>{
            let els=document.querySelectorAll('.chart-container circle');
            for(let i=0;i<els.length;i++){
                els[i].addEventListener("click",(e)=>{
                    let e_select=new Event('data-selected');
                    e_select.index=i;
                    that.parent.dispatchEvent(e_select);
                });
            }
        },500);
    }
}



/**
 * 工具对象
 */
const $$tool={
    /**
     * @param tag htmltagname
     * @param o:
     */
    createSVG:function(tag,o){
        var element=document.createElementNS("http://www.w3.org/2000/svg",tag);

        for (var i in o) {
            var val = o[i];
            if(i === "className") { i = "class"}
            if(i === "innerHTML") {
                element['textContent'] = val;
            } else {
                element.setAttribute(i, val);
            }
        }
    
        return element;
    },

    /**
     * @param tag htmltagname
     * 
     */
    createEl:function(tag,option){
        var element = document.createElement(tag);

        for(var i in option){
            var val=option[i];
            if (i in element) {
                element[i] = val;
            }
            else {
                element.setAttribute(i, val);
            }
        }

        return element;
    }
}