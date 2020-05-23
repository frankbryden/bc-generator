//TODO hovering over blocks would reveal task description
// link to what we're aiming for : https://onedrive.live.com/view.aspx?resid=A67F1CBEC0464F24!274&ithint=file%2cpptx&authkey=!AGk-1km5gUunPAM
// slide 21
const blockWidth = 60;
const blockHeight = 20;
const blockSpacing = 5;
const textHeight = 14;
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
                console.log("YES");
                return this.id
            }
        }
        //console.log("failed for " + this.id + ": (" + x + ", " + y + ")");
        //console.log(this);
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
        console.log(x + ", " + y);
        return this.blocks.map(block => block.onClick(x, y));
    }

    onRightClick(x, y){
        if (x > this.x && x < this.x + blockWidth){
            if (y > this.height && y < this.y){
                return true;
            }
        }
        return false;
    }

    removeBlock(blockId){
        let index = this.blocks.indexOf(this.blocks.filter(block => block.id === blockId)[0]);
        if (index !== -1){
            this.blocks.splice(index, 1);
            console.log('removed block from task ' + this.baseCol);
        }
    }
          

    initBlocks(){
        this.blocks = [];
        for (let i = 0; i < this.length; i++){
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
        this.blocks.forEach(block => block.render(ctx));
    }
}

class BurndownChart {
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
        this.renderBurndownLine = false;
        console.log("local coords init : " + this.toLocalCoordsY(0));
    }

    addTask(length, id, baseCol){
        let task = new Task(this.currentX, this.currentY, length, id, baseCol);
        this.currentY -= task.height + blockSpacing;
        this.tasks.push(task);
        for (let day of Object.keys(this.days)){
            let newTask = task.clone();
            newTask.x = this.getXShift(day);
            this.days[day].push(newTask);
            this.recalculateBlockPositionsOnDay(day);
        }
    }

    addDay(){
        this.currentX = this.getXShift(this.day);
        let sourceList;
        if (this.day === 0){
            sourceList = this.tasks;
            console.log('sourceList based on tasks');
        } else {
            sourceList = this.days[this.day - 1];
            console.log('sourceList based on previous day');
        }
        this.days[this.day] = sourceList.map((task) => {
            let newTask = task.clone();
            newTask.x = this.currentX;
            if (this.day === 0){
                newTask.initBlocks();
            }
            return newTask;
        });
        console.log(this.days[this.day]);
        this.recalculateBlockPositionsOnDay(this.day);
        this.day++;
        console.log(this.days);
    }


    onClick(x, y){
        for (let day of Object.keys(this.days)){
            let removedId = this.days[day].map(task => task.onClick(x, y)).flat().filter(v => v !== -1)[0];
            if (removedId !== undefined){
                this.removeBlock(removedId, day);
                this.recalculateBlockPositionsOnDay(day);
                return true;
            }
        }
        return false;
    }

    onRightClick(x, y){
        for (let day of Object.keys(this.days)){
            console.log(this.days[day]);
            let val = this.days[day].map(task => {
                return task.onRightClick(x, y)
            });
            console.log(val);
        }
    }

    toggleBurndownLine(){
        this.renderBurndownLine = !this.renderBurndownLine;
    }

    recalculateBlockPositionsOnDay(day){
        let currentY = this.toLocalCoordsY(0) - blockHeight;
        for (let task of this.days[day]){
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
            this.days[day] = this.days[day].filter(task => task.blocks.length > 0);
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

    getTopBlock(day){
        let dayTasks = this.days[day];
        // the dayTasks looks something like this
        //
        // *
        // *
        // *
        // +
        // +
        let topTask = dayTasks[dayTasks.length - 1];
        return topTask.blocks[topTask.blocks.length - 1];
    }

    render(ctx){
        ctx.fillStyle = this.bg;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        //Draw axis arrows
        ctx.beginPath();
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
        for (let day of Object.keys(this.days)){
            //console.log("drawing day at " + this.getXShift(day) + ", " + this.toLocalCoordsY(-this.margin));
            ctx.fillStyle = "#000000";
            ctx.fillText("Day " + day, this.getXShift(day), this.toLocalCoordsY(-this.margin + textHeight/2));
            //ctx.fillText("" + this.getXShift(day) + ", " + this.toLocalCoordsY(-this.margin + textHeight), 40, 605);
            this.days[day].forEach(task => task.render(ctx));
        }

        //Render burndown line
        console.log("Render burndown line - " + this.renderBurndownLine);
        if (this.renderBurndownLine){

            let currentY = this.getTopBlock(0).y;
            /*while (currentY === this.getTopBlock(i).y){
                currentY = this.getTopBlock(i).y;
                i++;
            }*/
            let currentX = this.getTopBlock(0).x + this.getTopBlock(0).width;
            let daysCount = Object.keys(this.days).length;
            for (let i = 0; i < daysCount; i++){
                ctx.strokeStyle = "black";
                let topBlockToday = this.getTopBlock(i);
                let topBlockTomorrowY = (i + 1) >= daysCount ? this.height : this.getTopBlock(i + 1).y;
                //let topBlockTomorrow = this.getTopBlock(i + 1);
                if (topBlockToday.y > currentY){
                    if (topBlockTomorrowY > topBlockToday.y){
                        //this block is lower than the last drawn block, we need to draw the line here
                        ctx.moveTo(currentX, currentY);
                        //move to the next block (the current block), which will become the starting point in the next
                        //iteration. Might as wall set those variables now.
                        currentX = topBlockToday.x + topBlockToday.width;
                        currentY = topBlockToday.y;
                        ctx.lineTo(currentX, currentY);
                        ctx.stroke();
                    }

                } else {
                    //currentX = topBlockToday.x + topBlockToday.width;
                    console.log("Render burndown line - skip wait for next - " + topBlockToday.y + " <= " + currentY);
                    //no work was done - the block is the same height as previous - skip
                }
            }
        }
        
    }
}

let canvas;
let ctx;
let chart;

function init(){
    ctx.font = textHeight + "px sans-serif";
    chart = new BurndownChart("rgba(206, 227, 229, 200)");
    chart.addTask(5, 1, "rgb(20, 180, 90)");
    chart.addTask(8, 2, "rgb(20, 90, 180)");
    chart.addTask(4, 3, "rgb(133, 93, 252)");
    chart.addDay();
}

let count = 0;

function animate(){
    //count++;
    if (count < 100){
        //requestAnimationFrame(animate);
    }
    chart.render(ctx);
}

// don't tell Jasmine about

document.addEventListener('DOMContentLoaded', function() {
    canvas = document.getElementById("canv");
    ctx = canvas.getContext("2d");
    init();
    
    let addDayBtn = document.getElementById("addDay");
    addDayBtn.onclick = function(){chart.addDay(); animate();};
    document.onclick = ev => {
        if (ev.srcElement === canvas){
            ev.preventDefault();
            let val = chart.onClick(ev.layerX, ev.layerY);
            animate();
            console.log(val);
        }
    };

    canvas.addEventListener('contextmenu', ev => {
        chart.onRightClick(ev.layerX, ev.layerY);
        ev.preventDefault();
    });

    //taskId,subTaskCount,taskColor
    let taskIdInput = document.getElementById("taskId");
    let subTaskCountInput = document.getElementById("subTaskCount");
    let taskColorInput = document.getElementById("taskColor");
    let chartColor = document.getElementById("chartColor");

    let addTaskBtn = document.getElementById("addTask");
    let drawLineChk = document.getElementById("drawLineChk");

    addTaskBtn.onclick = (() => {
        let taskId = parseInt(taskIdInput.value);
        let subTaskCount = parseInt(subTaskCountInput.value);
        let taskColor = taskColorInput.value;

        console.log(taskId);
        console.log(subTaskCount);
        console.log(taskColor);

        chart.addTask(subTaskCount, taskId, taskColor);
        animate();
    });

    drawLineChk.onchange = (ev => {
        chart.toggleBurndownLine();
        animate();
    });

    chartColor.onchange = (() => {
        chart.bg = chartColor.value;
        animate();
    });
    
    animate();
});