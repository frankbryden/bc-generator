//TODO hovering over blocks would reveal task description

var blockWidth = 60;
var blockHeight = 20;
var blockSpacing = 5;
var textHeight = 14;
class Block {
    constructor(x, y, width, height, id, color){
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.id = id;
        this.color = color;
    }

    clone(){
        return new Block(this.x, this.y, this.width, this.height, this.id, this.color);
    }

    onClick (x, y){
        if (x > this.x && x < this.x + this.width){
            if (y > this.y && y < this.y + this.height){
                return this.id
            }
        }
        return -1;
    }

    render(ctx){
        ctx.fillStyle = this.color;
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeRect(this.x, this.y, this.width, this.height);

    
        let textWidth = ctx.measureText("" + this.id).width;
        ctx.fillStyle = "black";
        ctx.fillText(this.id, this.x + this.width/2 - textWidth/2, this.y + 1.15*textHeight);
    }
}

class Task {
    constructor(x, y, length, id, baseCol){
        this.x = x;
        this.y = y;
        this.length = length;
        this.id = id;
        this.baseCol = baseCol;
        this.initBlocks();
    }

    clone(){
        let task = new Task(this.x, this.y, this.length, this.id, this.baseCol);
        task.blocks = this.blocks.map(block => block.clone());
        return task;
    }

    getIds(){
        let ids = [];
        this.blocks.forEach(block => {
            ids.push(block.id);
        });
        return ids;
    }

    onClick (x, y){
        return this.blocks.map(block => block.onClick(x, y));
    }

    removeBlock(blockId){
        let index = this.blocks.indexOf(this.blocks.filter(block => block.id == blockId)[0]);
        if (index != -1){
            this.blocks.splice(index, 1);
            console.log('removed block from task ' + this.baseCol);
        }
    }
          

    initBlocks(){
        this.blocks = [];
        for (var i = 0; i < this.length; i++){
            this.blocks.push(new Block(this.x, this.y - (blockHeight + blockSpacing)*i, blockWidth, blockHeight, this.id + (i + 1)/10, this.baseCol));
        }
        this.updateHeight();
    }

    recalculateBlockPositions(){
        for (var i = 0; i < this.blocks.length; i++){
            this.blocks[i].x = this.x;
            this.blocks[i].y = this.y - (blockHeight + blockSpacing)*i;
        }
        this.updateHeight();
    }

    updateHeight(){
        if (this.blocks.length > 0){
            this.height = this.blocks[0].y + this.blocks[0].height - this.blocks[this.blocks.length - 1].y;
        } else {
            this.height = - blockSpacing;
        }
        
    }

    render(ctx){
        for (var block of this.blocks){
            block.render(ctx);
        }
    }
}

class BurndownChart{
    constructor(bg){
        this.bg = bg;
        this.tasks = [];
        this.margin = 20;
        this.width = canvas.width - this.margin;
        this.height = canvas.height - this.margin;
        this.day = 0;
        this.days = {};
        this.currentX =  this.getXShift();
        this.currentY = this.toLocalCoordsY(0) - blockHeight;
        console.log("local coords init : " + this.toLocalCoordsY(0))
    }

    addTask(length, id, baseCol){
        let task = new Task(this.currentX, this.currentY, length, id, baseCol);
        this.currentY -= task.height + blockSpacing;
        this.tasks.push(task);
    }

    addDay(){
        this.currentX = this.getXShift(this.day);
        let sourceList;
        if (this.day == 0){
            sourceList = this.tasks;
            console.log('sourceList based on tasks');
        } else {
            sourceList = this.days[this.day - 1];
            console.log('sourceList based on previous day');
        }
        this.days[this.day] = sourceList.map((task) => {
            let newTask = task.clone();
            newTask.x = this.currentX;
            if (this.day == 0){
                newTask.initBlocks();
            }
            return newTask;
        });
        this.recalculateBlockPositionsOnDay(this.day);
        this.day++;
        console.log(this.days);
    }


    onClick(x, y){
        for (let day of Object.keys(this.days)){
            let removedId = this.days[day].map(task => task.onClick(x, y)).flat().filter(v => v != -1)[0];
            if (removedId != undefined){
                console.log("Day " + day + " -> " + removedId);
                this.removeBlock(removedId, day);
                this.recalculateBlockPositionsOnDay(day);
            }
        }
    }

    recalculateBlockPositionsOnDay(day){
        let currentY = this.toLocalCoordsY(0) - blockHeight;
        for (var task of this.days[day]){
            task.y = currentY;
            task.recalculateBlockPositions();
            currentY -= task.height + blockSpacing;
        }
    }

    removeBlock(blockId, blockDay){
        for (let day of Object.keys(this.days)){
            day = parseInt(day);

            if (day < blockDay){
                continue;
            }
            console.log("Need to remove " + blockId + " from");
            console.log(this.days[day]);
            this.days[day].forEach(task => {
                task.removeBlock(blockId);
                this.recalculateBlockPositionsOnDay(day);
            });
        }

    }

    getXShift(day){
        return this.toLocalCoordsX(this.margin) + day*(blockWidth + 2*blockSpacing);
    }

    toLocalCoordsX(x){
        return this.margin + x;
    }

    toLocalCoordsY(y){
        return this.height - y;
    }

    render(ctx){
        ctx.fillStyle = this.bg;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        //Draw axis arrows
        ctx.strokeStyle = "black";
        // X-axis
        ctx.moveTo(this.margin, this.height);
        ctx.lineTo(this.width, this.height);
        ctx.stroke();

        // Y-axis
        ctx.moveTo(this.margin, this.height);
        ctx.lineTo(this.margin, this.margin);
        ctx.stroke();

        //Render tasks
        for (var day of Object.keys(this.days)){
            //console.log("drawing day at " + this.getXShift(day) + ", " + this.toLocalCoordsY(-this.margin));
            ctx.fillStyle = "#000000";
            ctx.fillText("Day " + day, this.getXShift(day), this.toLocalCoordsY(-this.margin + textHeight/2));
            //ctx.fillText("" + this.getXShift(day) + ", " + this.toLocalCoordsY(-this.margin + textHeight), 40, 605);
            for (var task of this.days[day]){
                //console.log(task);
                task.render(ctx);
            }
            
        }
        
    }
}

var canvas;
var ctx;
var chart;

function init(){
    ctx.font = textHeight + "px sans-serif";
    chart = new BurndownChart("rgba(206, 227, 229, 200)");
    chart.addTask(4, 1, "rgb(180, 20, 90)");
    chart.addTask(5, 2, "rgb(20, 180, 90)");
    chart.addTask(8, 3, "rgb(20, 90, 180)");
    chart.addTask(4, 4, "rgb(133, 93, 252)");
}

var count = 0;

function animate(){
    //count++;
    if (count < 50){
        requestAnimationFrame(animate);
    }
    chart.render(ctx);
}

function sayHi(){
    console.log("hey");
}


document.addEventListener('DOMContentLoaded', function() {
    canvas = document.getElementById("canv");
    ctx = canvas.getContext("2d");
    init();
    
    let addDayBtn = document.getElementById("addDay");
    addDayBtn.onclick = function(){chart.addDay()};
    document.onclick = ev => {
        chart.onClick(ev.layerX, ev.layerY);
    };

    //taskId,subTaskCount,taskColor
    let taskIdInput = document.getElementById("taskId");
    let subTaskCountInput = document.getElementById("subTaskCount");
    let taskColorInput = document.getElementById("taskColor");

    let addTaskBtn = document.getElementById("addTask");
    
    animate();
});