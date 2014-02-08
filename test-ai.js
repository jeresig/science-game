var brain = require("brain");
var net = new brain.NeuralNetwork();

net.fromJSON(JSON.parse(require("fs").readFileSync("ai.json")));
var totalCards = 7;
var handCards = 6;

var colors = ["red", "green", "purple"];

var buildHandArray = function(handData, totalCards) {
    var inputHand = [];

    colors.forEach(function(color) {
        for (var n = 0; n < totalCards; n++) {
            inputHand.push(n < handData[color] ? 1 : 0);
        }
    });

    return inputHand;
};

for (var i = 0; i <= handCards; i++) {
    console.log(i, handCards - i);
    console.log(net.run(buildHandArray({
        red: i + 1,
        green: handCards - i,
        purple: 0
    }, totalCards)));
    console.log(net.run(buildHandArray({
        red: i,
        green: handCards - i + 1,
        purple: 0
    }, totalCards)));
    console.log(net.run(buildHandArray({
        red: i,
        green: handCards - i,
        purple: 1
    }, totalCards)));
}