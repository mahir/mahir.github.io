var nodes = null;
var edges = null;
var network = null;

function draw() {
  // create people.
  // value corresponds with the age of the person
  nodes = [
    { id: 1, value: 10, label: "Mahir", color: "#97C2FC" },
    { id: 2, value: 11, label: "Poorya" },
    { id: 3, value: 12, label: "Karina" },
    { id: 4, value: 16, label: "Juergen" },
    { id: 5, value: 17, label: "Yuri" },
    { id: 6, value: 15, label: "Deniz" },
    { id: 7, value: 6, label: "Sonja" },
    { id: 8, value: 5, label: "Emiko" },
    { id: 9, value: 30, label: "Dan" },
    { id: 10, value: 18, label: "Johannes", color: "#c00" },
  ];


  // create connections between people
  // value corresponds with the amount of contact between two people
  edges = [
    { from: 1, to: 8, value: 3 },
    { from: 2, to: 8, value: 3 },
    { from: 2, to: 9, value: 5 },
    { from: 2, to: 10, value: 1 },
    { from: 4, to: 6, value: 8 },
    { from: 5, to: 7, value: 2 },
    { from: 4, to: 5, value: 1 },
    { from: 9, to: 10, value: 2 },
    { from: 2, to: 3, value: 6 },
    { from: 3, to: 9, value: 4 },
    { from: 5, to: 3, value: 1 },
    { from: 2, to: 7, value: 4 },
  ];

  // Instantiate our network object.
  var container = document.getElementById("mynetwork");
  var data = {
    nodes: nodes,
    edges: edges,
  };
  var options = {
    interaction: { hover: true },
    nodes: {
      shape: "dot",
      font: {
      size: 18,
      color: "#ffffff",
    },
      scaling: {
        customScalingFunction: function (min, max, total, value) {
          return value / total;
        },
        min: 5,
        max: 150,
      },
    },
  };
  network = new vis.Network(container, data, options);

  network.on("click", function (params) {
    params.event = "[original event]";
    // document.getElementById("eventSpanHeading").innerText = "Click event:";
    // document.getElementById("content").innerText = "test"
    document.getElementById("content").style.display = "block"
    console.log("click event, getNodeAt returns: " + this.getNodeAt(params.pointer.DOM));
});
}

window.addEventListener("load", () => {
  draw();
});

document.getElementById("content").onclick = function(){
  document.getElementById("content").style.display = "none"
};


