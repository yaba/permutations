// A Tree is an object at the top level.
// A Tree contains Branches.
// Each Branch is [instantiated from] an array of Leaves (Interface: BranchArray)
// A Leaf can be one of string | Branch | BranchLink

interface BranchLink {
  branch: string;
}

interface BranchArray {
   splice: any;
   forEach(arg0: (array_item: any, index: any) => void);
   push(arg0: Branch);
   filter(arg0: (array_item: any) => boolean): string[];
   length: number;
   slice(number: number, number2: number): any[];
   map(arg0: (leaf: any) => any): any[];
   [index: number]: string | Array<BranchArray> | BranchLink;
}

class Tree {
    object: object;
    constructor(tree: object) { this.object = tree; }
    public get main() : Branch { return this.branch("main"); }
    public branch(key) : Branch {
      let branch = new Branch(this.object[key], this);
      return branch;
    }
    public get permutations() : string[] { return this.main.permutations; }
    private get longest_key() : string {
      return Object.keys(this.object).reduce((longest, key) => {
        if (key.length > longest.length) return key;
        else return longest;
      }, "");
    }

    public new_branch_reference(array: [], key: string = "") {
      //   Make a new key on the tree to host this then branch
      //   Use the longest length key and append an epoch stamp to avoid collisions
      const unique_key = `${this.longest_key}$`;

      this.object[unique_key] = array;
      return unique_key;
    }
}

class Leaf {
  val: string;
  _branches: Array<Branch>;

  constructor(val: string, _branches: Array<Branch> = []) {
    this.val = val;
    this._branches = _branches;
  }

  public get branches() : Array<Branch> {
    return this._branches.map(_branch => new Branch(_branch.array, _branch.tree, this.val));
  }

  append_branch(branch: Branch) {
    const terminal_branch = new Branch(branch.array, branch.tree, this.val);
    // @ts-ignore
    this._branches.push(terminal_branch);
    // @ts-ignore
  }

  public get terminal_leaves() : Array<Leaf> {
    if (!this.branches.length) return [this];
    return this.branches.reduce((arr, branch) => {
      // @ts-ignore

      return arr.concat(branch.terminal_leaves);
    }, []);
  }
}

class Branch {
  array: BranchArray;
  tree: Tree;
  prefix: string;
  memoized_leaves: Array<Leaf>;

  constructor(branch: BranchArray, tree: Tree, prefix: string = "") {
    this.array                  = branch;
    this.tree                   = tree;
    this.prefix                 = prefix;
    this.memoized_leaves        = [];
  }

  public get permutations() : string[] {
    return this.terminal_leaves.map(leaf => leaf.val);
  }

  public get terminal_leaves() : Array<Leaf> {
    return this.leaves.reduce((permutations, leaf) => {
      return permutations.concat(leaf.terminal_leaves);
    }, []);
  }

  public get leaves() : Array<Leaf> {
    if (this.memoized_leaves.length) return this.memoized_leaves;
    let leaves       = this.leaves_as_strings;
    // @ts-ignore

    if (this.sub_branches.length && !leaves.length) {
      leaves = [""];
    }

    this.memoized_leaves = leaves.map((leaf) => {
      return new Leaf(`${this.prefix}${leaf}`, this.sub_branches)
    });

    return this.memoized_leaves;
  }

  private get leaves_as_strings() {
    return this.array.filter(array_item => array_item.constructor.name === "String");
  }

  translate_branch_pointers() {
    this.array.forEach((array_item, index) => {
      if (array_item.constructor.name === "Object" && array_item["branch"]) {
        let branch : string[] = JSON.parse(JSON.stringify(this.tree.object[array_item.branch]));

        if (array_item['then']) {
          if (array_item.then.constructor.name === "String") array_item.then = [array_item.then];
          const unique_key = this.tree.new_branch_reference(array_item.then);
          //   Put a { "branch": "<that long key>" } on the deep end of the array below.
          const reference = { "branch": unique_key };
          branch = this.add_reference_to_branch_deep_end({ branch: branch, reference: reference });
        }

        // @ts-ignore
        this.array[index] = branch;
      }
    });
  }

  private add_reference_to_branch_deep_end(args = { branch: [], reference: {} }) {
    const branch = args.branch, reference = args.reference;
    if (branch.constructor.name === "String") return branch;
    const branch_has_arrays = branch.some(item => Array.isArray(item));

    if (branch_has_arrays) {
      return branch.map(item => this.add_reference_to_branch_deep_end({ branch: item, reference: reference }));
    }
    else {
      branch.push(reference);
      return branch
    }
  }

  public get sub_branches() : Array<Branch> {
    this.translate_branch_pointers();

    // Take the raw nested array and turn it into Branches.
    // @ts-ignore
    return this.array.filter(array_item => Array.isArray(array_item))
      // @ts-ignore
      .map(array_item => new Branch(array_item, this.tree));
  }
}

module.exports = Tree;