const piggy = document.getElementById("piggy");

piggy.addEventListener("dragstart", onDragStart);
piggy.addEventListener("dragover", onDragOver);
piggy.addEventListener("drop", onDrop);
piggy.addEventListener("dragend", onDragEnd);

let draggedTargetId = null;
function onDragStart(e) {
    const target = e.currentTarget;
    draggedTargetId = target.dataset.id;
    target.classList.add("dragging");

    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", draggedTargetId);
    console.log("drag start");
}

function onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    console.log("drag over");
}

function onDrop(e) {
    e.preventDefault();
    console.log("drop");
}

function onDragEnd(e){
    e.currentTarget.classList.remove("dragging");
    draggedTargetId = null;
}
// dataTransfer = a tiny backpack attached to the dragged object

