'use_strict'

fs = require('fs')

// Finds last element in an array
Array.prototype.last = function () {
  return this[this.length - 1]
}

// Shuffles array randomly
Array.prototype.shuffle = function() {
  var i = this.length, j, temp;
  if ( i == 0 ) return this;
  while ( --i ) {
     j = Math.floor( Math.random() * ( i + 1 ) );
     temp = this[i];
     this[i] = this[j];
     this[j] = temp;
  }
  return this;
}

// Returns largest element in array
Array.prototype.max = function(){
    return Math.max.apply( Math, this );
}

// Removes element with index i from array
Array.prototype.remove = function(i) {
    this.splice(i, 1);
}

// Clones an array, this is needed when passing arrays to recursive functions
Array.prototype.clone = function() {
	return this.slice(0);
}

Array.prototype.argmax = function() {
	return this.indexOf(this.max())
}

// Tree class used by DTL - algorithm later
class Tree {
  constructor(attribute){
    this.children = []
    this.attribute = attribute
  }
  add_branch(branch){
    this.children.push(branch)
  }
}

// Reads file from disk
function READ_FILE(name) {
  const data = fs.readFileSync(name, 'utf8')
    .split('\n')
      .map(e => e.split('\t'))

  return data.map(e =>
    e.map(i => parseInt(i,10)))
}


// Entropy of set when split on an attribute
function ENTROPY(set, attribute) {
  const freq = {}
  let dataEntropy = 0

  set.forEach(record => {
    if(freq.hasOwnProperty(record[attribute])){
      freq[record[attribute]] += 1.0
    } else {
      freq[record[attribute]] = 1.0
    }
  })
  for (key in freq){
    const f = freq[key]
    dataEntropy += (-f / set.length * Math.log2(f / set.length))
  }
  return dataEntropy
}

// Perecent to Entropy
function B(q) {
  if(q >= 1 || q <= 0) return 0
  return - (q * Math.log2(q) + (1 - q) * Math.log2(1 - q))
}

// Entropy of the set
function H(set) {
  return B(set.filter(r =>
     r.last() === 2).length / set.length)
}

// Reduction in Entropy when splitting on an attribute
function INFORMATION_GAIN(set, attribute) {
  return  - (H(set) - ENTROPY(set, attribute))
}

// Importance as defined in the text book
function IMPORTANCE(set, attribute, random) {
  if (random) return random_importance[attribute]
  return INFORMATION_GAIN(set, attribute)
}

function PLURAILITY_VALUE(parent_examples) {
  const one_count = parent_examples.filter(r => r.last() === 1).length
  const two_count = parent_examples.filter(r => r.last() === 2).length
  if (one_count > two_count) return 1
  return 2
}

// Checks if all examples have the same classification
function IS_SAME_CLASIFICATION(examples) {
  return examples.filter(r =>
    r.last() === examples[0].last())
      .length === examples.length
}

// DECISION_TREE_LEARNING from psedudo code in the text book
function DECISION_TREE_LEARNING(examples, attributes, parent_examples) {
  if (examples.length === 0 ) return new Tree(PLURAILITY_VALUE(parent_examples))
  if (IS_SAME_CLASIFICATION(examples)) return new Tree(examples[0].last())
  if (attributes.length === 0) return new Tree(PLURAILITY_VALUE(examples))

  // Calculate importance either random or with information_gain
  const importance = attributes.map(e => IMPORTANCE(examples, e, true))
  const A = importance.argmax()

  // Construct a new tree
  const tree = new Tree(A)

  // Repeats for every value an attribute can possibly have (just 1 and 2 in this case)
  const values = [1, 2]
  values.forEach(vk => {
    const exs = examples.filter(e => e[A] === vk)
    const clone = attributes.clone()
    clone.remove(A)
    const branch = DECISION_TREE_LEARNING(exs, clone, examples)
    tree.add_branch(branch)
  })
  return tree
}

// Used to classify if my decision tree correctly classifed test data
function classify(tree, row) {
  if(tree.children.length === 0){
    // Is true if decision tree predicted correctly
    return row.last() === tree.attribute
  }
  else {
    const index = row[tree.attribute] - 1
    return classify(tree.children[index], row)
  }
}

// Prints tree in terminal with indents
function print(tree, depth) {
  if(tree.children.length === 0){
    console.log('  '.repeat(depth * 3) + 'LEAF: ' + tree.attribute)
  }
  else {
    console.log('  '.repeat(depth * 3) + 'BRANCH: ' + tree.attribute)
    tree.children.forEach(c => print(c, depth + 1))
  }

}

const set = READ_FILE('training.txt') // read training file
const test = READ_FILE('test.txt')  // read test file
const random_importance = [1,2,3,4,5,6,7].shuffle() // Used to generate random importance

const tree = DECISION_TREE_LEARNING(set, [0,1,2,3,4,5,6], set) // Build tree

const results = test.map(row => classify(tree, row)) // get result using our decision tree
// logs perecentage correctly classified
console.log(results.filter(r => r === true).length / results.length)

print(tree, 0 ) // Print our tree
