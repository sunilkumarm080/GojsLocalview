import { Component, AfterViewInit, ViewChild, module } from "@angular/core";
import * as go from "gojs";

@Component({
  moduleId: module.id,
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent implements AfterViewInit {
  title = "angular-gojs-test works!";
  myFullDiagram: go.Diagram;
  myLocalDiagram: go.Diagram;
  highlighter: any;
  $: any;
  constructor() {
    this.myFullDiagram = new go.Diagram();
    this.myLocalDiagram = new go.Diagram();
    this.$ = go.GraphObject.make;
  }

  ngAfterViewInit() {
    let that = this;
    // the template we defined earlier
    // for conciseness in defining templates
    this.myFullDiagram = this.$(
      go.Diagram,
      "fullDiagram", // each diagram refers to its DIV HTML element by id
      {
        initialAutoScale: go.Diagram.UniformToFill, // automatically scale down to show whole tree
        maxScale: 0.25,
        contentAlignment: go.Spot.Center, // center the tree in the viewport
        isReadOnly: true, // don't allow user to change the diagram
        "animationManager.isEnabled": false,
        layout: this.$(go.TreeLayout, {
          angle: 90,
          sorting: go.TreeLayout.SortingAscending
        }),
        maxSelectionCount: 1, // only one node may be selected at a time in each diagram
        // when the selection changes, update the myLocalDiagram view
        ChangedSelection: function() {
          that.showLocalOnFullClick();
        }
      }
    );

    this.myLocalDiagram = this.$(go.Diagram, "localDiagram", {
      // this is very similar to the full Diagram
      autoScale: go.Diagram.UniformToFill,
      contentAlignment: go.Spot.Center,
      isReadOnly: true,
      layout: this.$(go.TreeLayout, {
        angle: 90,
        sorting: go.TreeLayout.SortingAscending
      }),
      LayoutCompleted: function(e) {
        const sel = e.diagram.selection.first();
        if (sel !== null) {
          that.myLocalDiagram.scrollToRect(sel.actualBounds);
        }
      },
      maxSelectionCount: 1,
      // when the selection changes, update the contents of the myLocalDiagram
      ChangedSelection: function() {
        that.showLocalOnLocalClick();
      }
    });

    // Define a node template that is shared by both diagrams
    const myNodeTemplate = this.$(
      go.Node,
      "Auto",
      { locationSpot: go.Spot.Center },
      new go.Binding("text", "key", go.Binding.toString), // for sorting
      this.$(go.Shape, "Rectangle", new go.Binding("fill", "color"), {
        stroke: null
      }),
      this.$(
        go.TextBlock,
        { margin: 5 },
        new go.Binding("text", "key", function(k) {
          return "node" + k;
        })
      )
    );
    this.myFullDiagram.nodeTemplate = myNodeTemplate;
    this.myLocalDiagram.nodeTemplate = myNodeTemplate;

    // Define a basic link template, not selectable, shared by both diagrams
    const myLinkTemplate = this.$(
      go.Link,
      { routing: go.Link.Normal, selectable: false },
      this.$(go.Shape, { strokeWidth: 1 })
    );
    this.myFullDiagram.linkTemplate = myLinkTemplate;
    this.myLocalDiagram.linkTemplate = myLinkTemplate;

    // Create the full tree diagram
    this.setupDiagram(undefined);

    // Create a part in the background of the full diagram to highlight the selected node

    setTimeout(() => {
      this.highlighter = this.$(
        go.Part,
        "Auto",
        {
          layerName: "Background",
          selectable: false,
          isInDocumentBounds: false,
          locationSpot: go.Spot.Center
        },
        this.$(go.Shape, "Ellipse", {
          fill: this.$(go.Brush, "Radial", { 0.0: "yellow", 1.0: "white" }),
          stroke: null,
          desiredSize: new go.Size(400, 400)
        })
      );
      this.myFullDiagram.add(this.highlighter);

      // Start by focusing the diagrams on the node at the top of the tree.
      // Wait until the tree has been laid out before selecting the root node.

      this.myFullDiagram.addDiagramListener("InitialLayoutCompleted", function(
        e
      ) {
        const newLocal = this.myFullDiagram.findPartForKey(0);
        const node0 = newLocal;
        if (node0 !== null) {
          node0.isSelected = true;
        }
        this.showLocalOnFullClick();
      });
    }, 500);
  }

  // showLocalOnFullClick Function
  showLocalOnLocalClick() {
    const selectedLocal = this.myLocalDiagram.selection.first();
    if (selectedLocal !== null) {
      // there are two separate Nodes, one for each Diagram, but they share the same key value
      this.myFullDiagram.select(
        this.myFullDiagram.findPartForKey(selectedLocal.data.key)
      );
    }
  }

  showlocalfull2() {}
  /** showLocalOnFullClick Fucntion */
  showLocalOnFullClick() {
    var self = this;
    const node = self.myFullDiagram.selection.first();
    if (node !== null) {
      // make sure the selected node is in the viewport
      self.myFullDiagram.scrollToRect(node.actualBounds);
      // move the large yellow node behind the selected node to highlight it
      this.highlighter.location = node.location;
      // create a new model for the local Diagram
      const model = new go.TreeModel();
      // add the selected node and its children and grandchildren to the local diagram
      const nearby = node.findTreeParts(3); // three levels of the (sub)tree
      // add parent and grandparent
      const parent = node.findTreeParentNode();
      if (parent !== null) {
        nearby.add(parent);
        const grandparent = parent.findTreeParentNode();
        if (grandparent !== null) {
          nearby.add(grandparent);
        }
      }
      // create the model using the same node data as in myFullDiagram's model
      nearby.each(function(n) {
        if (n instanceof go.Node) {
          model.addNodeData(n.data);
        }
      });
      self.myLocalDiagram.model = model;
      // select the node at the diagram's focus
      const selectedLocal = self.myLocalDiagram.findPartForKey(node.data.key);
      if (selectedLocal !== null) {
        selectedLocal.isSelected = true;
      }
    }
  }

  setupDiagram(total) {
    if (total === undefined) {
      total = 100;
    } // default to 100 nodes
    const nodeDataArray = [];
    for (let i = 0; i < total; i++) {
      nodeDataArray.push({
        key: nodeDataArray.length,
        color: go.Brush.randomColor()
      });
    }
    let j = 0;
    for (let i = 1; i < total; i++) {
      const data = nodeDataArray[i];
      data.parent = j;
      if (Math.random() < 0.3) {
        j++;
      } // this controls the likelihood that there are enough children
    }
    this.myFullDiagram.model = new go.TreeModel(nodeDataArray);
  }
}
