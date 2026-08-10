"use strict";

(function exposeForestRenderer() {
  const componentPalette = [
    [164, 24, 64],
    [205, 28, 63],
    [42, 38, 63],
    [16, 35, 62],
    [92, 20, 60],
    [260, 16, 67],
    [182, 24, 58],
    [32, 26, 71],
    [340, 22, 67],
    [218, 18, 68],
  ];
  const paletteSettings = {
    minSaturation: 12,
    maxSaturation: 45,
    minLightness: 52,
    maxLightness: 76,
    strokeSaturation: 18,
    strokeLightness: 30,
  };
  const minimumZoom = 0.001;
  const maximumZoom = 2.5;
  const componentCollisionGap = 28;
  const componentRepulsionRange = 72;
  const localPhysicsPadding = 280;

  function colorForComponent(colorIndex) {
    const index = Math.max(0, colorIndex);
    const [baseHue, baseSaturation, baseLightness] =
      componentPalette[index % componentPalette.length];
    const cycle = Math.floor(index / componentPalette.length);
    const hue = (baseHue + Math.floor(cycle / 5) * 2) % 360;
    const saturationOffsets = [0, -7, 5, -3, 3];
    const lightnessOffsets = [0, 5, -4, 2, -2];
    const saturation = Math.max(
      paletteSettings.minSaturation,
      Math.min(
        paletteSettings.maxSaturation,
        baseSaturation + saturationOffsets[cycle % 5],
      ),
    );
    const lightness = Math.max(
      paletteSettings.minLightness,
      Math.min(
        paletteSettings.maxLightness,
        baseLightness + lightnessOffsets[cycle % 5],
      ),
    );
    return {
      fill: `hsl(${hue.toFixed(1)} ${saturation}% ${lightness}%)`,
      stroke:
        `hsl(${hue.toFixed(1)} ` +
        `${paletteSettings.strokeSaturation}% ${paletteSettings.strokeLightness}%)`,
    };
  }

  function cubicBezierCoordinate(start, first, second, end, t) {
    const remaining = 1 - t;
    return (
      remaining ** 3 * start +
      3 * remaining ** 2 * t * first +
      3 * remaining * t ** 2 * second +
      t ** 3 * end
    );
  }

  function hashString(text) {
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function seededRandom(seed) {
    let state = seed >>> 0;
    return () => {
      state += 0x6d2b79f5;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffledCopy(values, random) {
    const result = [...values];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
  }

  function splitForestComponents(forest) {
    const byId = new Map(forest.vertices.map((vertex) => [vertex.id, vertex]));
    const edgesByParent = new Map(
      forest.vertices.map((vertex) => [vertex.id, []]),
    );
    const childIds = new Set();
    for (const edge of forest.edges) {
      edgesByParent.get(edge.parent).push(edge);
      childIds.add(edge.child);
    }

    const roots = forest.vertices
      .filter((vertex) => !childIds.has(vertex.id))
      .sort(
        (left, right) =>
          left.block - right.block ||
          left.first_position - right.first_position ||
          left.type - right.type,
      );

    return roots.map((root) => {
      const vertexIds = new Set();
      const edges = [];
      const stack = [root.id];
      while (stack.length) {
        const nodeId = stack.pop();
        vertexIds.add(nodeId);
        for (const edge of edgesByParent.get(nodeId)) {
          edges.push(edge);
          stack.push(edge.child);
        }
      }
      return {
        root,
        vertices: [...vertexIds].map((vertexId) => byId.get(vertexId)),
        edges,
      };
    });
  }

  function layoutComponent(component, compact = false) {
    const byId = new Map(
      component.vertices.map((vertex) => [vertex.id, vertex]),
    );
    const children = new Map(
      component.vertices.map((vertex) => [vertex.id, []]),
    );
    for (const edge of component.edges) {
      children.get(edge.parent).push(edge.child);
    }

    const sortNodes = (leftId, rightId) => {
      const left = byId.get(leftId);
      const right = byId.get(rightId);
      return (
        left.first_position - right.first_position ||
        left.type - right.type ||
        left.id.localeCompare(right.id)
      );
    };
    for (const nodeChildren of children.values()) {
      nodeChildren.sort(sortNodes);
    }

    const positions = new Map();
    let leafCursor = 0;
    const xSpacing = compact ? 112 : 136;
    const ySpacing = 104;
    const marginX = 56;
    const marginY = 46;

    function place(nodeId, depth) {
      const nodeChildren = children.get(nodeId);
      let x;
      if (nodeChildren.length === 0) {
        x = marginX + leafCursor * xSpacing;
        leafCursor += 1;
      } else {
        const childX = nodeChildren.map((childId) =>
          place(childId, depth + 1),
        );
        x = childX.reduce((sum, value) => sum + value, 0) / childX.length;
      }
      positions.set(nodeId, {
        x,
        y: marginY + depth * ySpacing,
        depth,
      });
      return x;
    }

    place(component.root.id, 0);
    const maxDepth = Math.max(
      0,
      ...[...positions.values()].map((position) => position.depth),
    );
    return {
      positions,
      width: Math.max(
        220,
        marginX * 2 + Math.max(0, leafCursor - 1) * xSpacing,
      ),
      height: Math.max(160, marginY * 2 + maxDepth * ySpacing + 44),
    };
  }

  function scatterPositions(items, random, viewportWidth) {
    const padding = 84;
    const separation = 64;
    if (items.length === 0) {
      return {
        positions: new Map(),
        width: Math.max(920, viewportWidth),
        height: 440,
      };
    }

    const totalArea = items.reduce(
      (sum, item) =>
        sum +
        (item.layout.width + separation) *
          (item.layout.height + separation),
      0,
    );
    let extentX = Math.max(900, Math.sqrt(totalArea * 1.9));
    let extentY = Math.max(620, totalArea * 1.9 / extentX);
    const cellSize = 320;
    const cells = new Map();
    const bodies = [];

    function cellRange(bounds) {
      return {
        minX: Math.floor(bounds.minX / cellSize),
        maxX: Math.floor(bounds.maxX / cellSize),
        minY: Math.floor(bounds.minY / cellSize),
        maxY: Math.floor(bounds.maxY / cellSize),
      };
    }

    function candidateBounds(item, x, y) {
      const halfGap = separation / 2;
      return {
        minX: x - halfGap,
        minY: y - halfGap,
        maxX: x + item.layout.width + halfGap,
        maxY: y + item.layout.height + halfGap,
      };
    }

    function overlapsPlaced(bounds) {
      const range = cellRange(bounds);
      const candidates = new Set();
      for (let cellX = range.minX; cellX <= range.maxX; cellX += 1) {
        for (let cellY = range.minY; cellY <= range.maxY; cellY += 1) {
          const entries = cells.get(`${cellX}:${cellY}`);
          if (!entries) continue;
          for (const index of entries) candidates.add(index);
        }
      }
      for (const index of candidates) {
        const other = bodies[index].bounds;
        if (
          bounds.maxX > other.minX &&
          bounds.minX < other.maxX &&
          bounds.maxY > other.minY &&
          bounds.minY < other.maxY
        ) {
          return true;
        }
      }
      return false;
    }

    function insertBody(body) {
      const index = bodies.length;
      bodies.push(body);
      const range = cellRange(body.bounds);
      for (let cellX = range.minX; cellX <= range.maxX; cellX += 1) {
        for (let cellY = range.minY; cellY <= range.maxY; cellY += 1) {
          const key = `${cellX}:${cellY}`;
          if (!cells.has(key)) cells.set(key, []);
          cells.get(key).push(index);
        }
      }
    }

    const placementOrder = items
      .map((item) => ({ item, tieBreaker: random() }))
      .sort(
        (left, right) =>
          right.item.layout.width * right.item.layout.height -
            left.item.layout.width * left.item.layout.height ||
          left.tieBreaker - right.tieBreaker,
      );

    for (const entry of placementOrder) {
      const item = entry.item;
      let candidate = null;
      for (let expansion = 0; expansion < 24 && !candidate; expansion += 1) {
        const scale = 1 + expansion * 0.12;
        const availableWidth = Math.max(item.layout.width, extentX * scale);
        const availableHeight = Math.max(item.layout.height, extentY * scale);
        for (let attempt = 0; attempt < 28; attempt += 1) {
          const x =
            random() * Math.max(1, availableWidth - item.layout.width);
          const y =
            random() * Math.max(1, availableHeight - item.layout.height);
          const bounds = candidateBounds(item, x, y);
          if (!overlapsPlaced(bounds)) {
            candidate = { item, x, y, bounds };
            extentX = Math.max(extentX, availableWidth);
            extentY = Math.max(extentY, availableHeight);
            break;
          }
        }
      }
      if (!candidate) {
        const x = extentX + separation;
        const y = random() * Math.max(1, extentY - item.layout.height);
        candidate = {
          item,
          x,
          y,
          bounds: candidateBounds(item, x, y),
        };
        extentX = x + item.layout.width + separation;
      }
      insertBody(candidate);
    }

    const minX = Math.min(0, ...bodies.map((body) => body.x));
    const minY = Math.min(0, ...bodies.map((body) => body.y));
    const offsetX = padding - minX;
    const offsetY = padding - minY;
    const positions = new Map();
    let maxX = 0;
    let maxY = 0;
    for (const body of bodies) {
      const position = {
        x: body.x + offsetX,
        y: body.y + offsetY,
      };
      positions.set(body.item.component.root.id, position);
      maxX = Math.max(maxX, position.x + body.item.layout.width);
      maxY = Math.max(maxY, position.y + body.item.layout.height);
    }
    return {
      positions,
      width: Math.max(920, viewportWidth, maxX + padding),
      height: Math.max(440, maxY + padding),
    };
  }

  function componentVisualFootprint(item, flipped = false) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const position of item.layout.positions.values()) {
      const y = flipped ? item.layout.height - position.y : position.y;
      minX = Math.min(minX, position.x - 50);
      minY = Math.min(minY, y - 33);
      maxX = Math.max(maxX, position.x + 50);
      maxY = Math.max(maxY, y + 33);
    }
    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
      vertexCount: item.component.vertices.length,
    };
  }

  function compareReadingItems(left, right) {
    const leftSize = left.readingFootprint;
    const rightSize = right.readingFootprint;
    return (
      leftSize.vertexCount - rightSize.vertexCount ||
      leftSize.width * leftSize.height - rightSize.width * rightSize.height ||
      left.component.root.block - right.component.root.block ||
      left.component.root.id.localeCompare(right.component.root.id)
    );
  }

  function preferredRowCapacity(entry, maximumCapacity) {
    const footprint = entry.readingFootprint;
    if (
      footprint.vertexCount <= 3 &&
      footprint.width <= 160 &&
      footprint.height <= 330
    ) {
      return maximumCapacity;
    }
    if (
      footprint.vertexCount <= 6 &&
      footprint.width <= 300 &&
      footprint.height <= 520
    ) {
      return Math.min(8, maximumCapacity);
    }
    if (footprint.vertexCount <= 12 && footprint.width <= 560) {
      return Math.min(4, maximumCapacity);
    }
    if (footprint.vertexCount <= 22 && footprint.width <= 900) {
      return Math.min(2, maximumCapacity);
    }
    return 1;
  }

  function readingPositions(items, viewportWidth) {
    const padding = 44;
    const gapX = 14;
    const gapY = 46;
    const targetWidth = Math.max(
      1160,
      Math.min(1480, viewportWidth * 1.9),
    );
    const maximumCapacity =
      viewportWidth < 520 ? 6 : viewportWidth < 680 ? 10 : 12;
    const rows = [];
    let row = null;

    for (const item of items) {
      const footprint = item.readingFootprint;
      const capacity = preferredRowCapacity(item, maximumCapacity);
      const proposedWidth = row
        ? row.width + gapX + footprint.width
        : footprint.width;
      if (
        !row ||
        row.capacity !== capacity ||
        row.items.length >= capacity ||
        proposedWidth > targetWidth
      ) {
        row = {
          capacity,
          items: [],
          width: 0,
          height: 0,
        };
        rows.push(row);
      }
      if (row.items.length > 0) row.width += gapX;
      row.items.push(item);
      row.width += footprint.width;
      row.height = Math.max(row.height, footprint.height);
    }

    const contentWidth = Math.max(
      targetWidth,
      ...rows.map((candidate) => candidate.width),
    );
    const positions = new Map();
    let y = padding;
    for (const candidate of rows) {
      const centeredOffset = (contentWidth - candidate.width) / 2;
      const rowOffset =
        contentWidth > targetWidth
          ? Math.min(84, centeredOffset)
          : centeredOffset;
      let x = padding + rowOffset;
      for (const item of candidate.items) {
        const footprint = item.readingFootprint;
        positions.set(item.component.root.id, {
          x: x - footprint.minX,
          y:
            y +
            (candidate.height - footprint.height) / 2 -
            footprint.minY,
        });
        x += footprint.width + gapX;
      }
      y += candidate.height + gapY;
    }

    return {
      positions,
      width: contentWidth + padding * 2,
      height: Math.max(440, y - gapY + padding),
    };
  }

  function roundedRect(context, x, y, width, height, radius) {
    const limitedRadius = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + limitedRadius, y);
    context.lineTo(x + width - limitedRadius, y);
    context.quadraticCurveTo(x + width, y, x + width, y + limitedRadius);
    context.lineTo(x + width, y + height - limitedRadius);
    context.quadraticCurveTo(
      x + width,
      y + height,
      x + width - limitedRadius,
      y + height,
    );
    context.lineTo(x + limitedRadius, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - limitedRadius);
    context.lineTo(x, y + limitedRadius);
    context.quadraticCurveTo(x, y, x + limitedRadius, y);
    context.closePath();
  }

  function rectangleDistance(first, second) {
    const deltaX = Math.max(
      0,
      first.minX - second.maxX,
      second.minX - first.maxX,
    );
    const deltaY = Math.max(
      0,
      first.minY - second.maxY,
      second.minY - first.maxY,
    );
    return Math.hypot(deltaX, deltaY);
  }

  class ForestRenderer {
    constructor(options) {
      this.viewport = options.viewport;
      this.stage = options.stage;
      this.sizer = this.stage.parentElement;
      this.zoomRange = options.zoomRange;
      this.zoomLabel = options.zoomLabel;
      this.fitButton = options.fitButton;
      this.canvas = document.createElement("canvas");
      this.canvas.className = "forest-canvas";
      this.canvas.setAttribute("role", "img");
      this.canvas.setAttribute(
        "aria-label",
        "Interactive weighted rooted forest",
      );
      this.context = this.canvas.getContext("2d", {
        alpha: true,
        desynchronized: true,
      });
      this.stage.replaceChildren(this.canvas);

      this.forest = null;
      this.canonicalWord = [];
      this.layoutMode = "scatter";
      this.flipped = false;
      this.shuffleRound = 0;
      this.states = new Map();
      this.componentOrder = [];
      this.elasticComponentIds = new Set();
      this.worldWidth = 920;
      this.worldHeight = 440;
      this.scatterBoundary = null;
      this.scatterMinimumZoom = minimumZoom;
      this.zoomLevel = 1;
      this.panX = 0;
      this.panY = 0;
      this.dragState = null;
      this.panState = null;
      this.hoveredNode = null;
      this.physicsFrame = null;
      this.drawFrame = null;
      this.physicsFramesRemaining = 0;
      this.stableTicks = 0;
      this.lastPhysicsTimestamp = 0;
      this.simulationSleeping = true;
      this.interactionRootId = null;
      this.devicePixelRatio = 1;
      this.viewportWidth = 1;
      this.viewportHeight = 1;
      this.totalNodes = 0;
      this.totalEdges = 0;
      this.lastVisibleComponentCount = 0;
      this.drawingColors = {
        edge: "#7d8882",
        labelBackground: "#f4f2ea",
        labelLine: "#9da49d",
        labelInk: "#343b37",
        nodeInk: "#252b28",
        dragStroke: "#4f7782",
        nodeShadow: "rgba(49, 58, 53, 0.19)",
      };

      this.bindEvents();
      this.resize();
      this.refreshAppearance();
    }

    bindEvents() {
      this.zoomRange.addEventListener("input", () => {
        const sliderPosition = Number(this.zoomRange.value) / 100;
        const lowerZoom = this.minimumAllowedZoom();
        const nextZoom =
          lowerZoom *
          Math.pow(maximumZoom / lowerZoom, sliderPosition);
        this.setZoom(nextZoom);
      });
      this.fitButton.addEventListener("click", () => this.fitAll());

      this.viewport.addEventListener(
        "scroll",
        () => {
          if (this.layoutMode === "grid") this.requestDraw();
        },
        { passive: true },
      );

      this.viewport.addEventListener(
        "wheel",
        (event) => {
          if (this.layoutMode === "grid") return;
          if (!event.ctrlKey && !event.metaKey) return;
          event.preventDefault();
          const boundedDelta = Math.max(-80, Math.min(80, event.deltaY));
          const factor = Math.exp(-boundedDelta * 0.0015);
          this.setZoom(
            this.zoomLevel * factor,
            event.clientX,
            event.clientY,
          );
        },
        { passive: false },
      );

      this.viewport.addEventListener("pointerdown", (event) => {
        if (this.layoutMode === "grid") return;
        if (event.button !== 0 || this.dragState || this.panState) return;
        const world = this.clientToWorld(event.clientX, event.clientY);
        const hit = this.findNodeAt(world.x, world.y);
        event.preventDefault();
        if (hit) {
          this.startNodeDrag(event, hit);
        } else {
          this.startPan(event);
        }
      });

      this.viewport.addEventListener("pointermove", (event) => {
        if (this.layoutMode === "grid") {
          this.hoveredNode = null;
          this.viewport.classList.remove("node-hover");
          return;
        }
        if (this.dragState) {
          this.moveNodeDrag(event);
          return;
        }
        if (this.panState) {
          this.movePan(event);
          return;
        }
        const world = this.clientToWorld(event.clientX, event.clientY);
        this.hoveredNode = this.findNodeAt(world.x, world.y);
        this.viewport.classList.toggle("node-hover", Boolean(this.hoveredNode));
      });

      const finishPointer = (event) => {
        if (this.dragState && this.dragState.pointerId === event.pointerId) {
          this.finishNodeDrag(event);
        }
        if (this.panState && this.panState.pointerId === event.pointerId) {
          this.finishPan(event);
        }
      };
      this.viewport.addEventListener("pointerup", finishPointer);
      this.viewport.addEventListener("pointercancel", finishPointer);
    }

    render(forest, canonicalWord, options = {}) {
      this.stopPhysics();
      this.forest = forest;
      this.canonicalWord = [...canonicalWord];
      this.layoutMode = options.layoutMode || this.layoutMode;
      this.flipped = options.flipped ?? this.flipped;
      this.shuffleRound = options.shuffleRound ?? 0;
      this.dragState = null;
      this.panState = null;
      this.hoveredNode = null;
      this.interactionRootId = null;
      this.viewport.classList.remove(
        "panning",
        "node-hover",
        "node-dragging",
        "motion-active",
      );
      this.panX = 0;
      this.panY = 0;
      this.viewport.scrollTop = 0;
      this.viewport.scrollLeft = 0;
      const gridMode = this.layoutMode === "grid";
      this.viewport.classList.toggle("grid-scroll", gridMode);
      this.zoomRange.disabled = gridMode;
      this.zoomRange.setAttribute("aria-disabled", String(gridMode));
      if (!gridMode) {
        this.sizer.style.height = "";
        this.sizer.style.width = "";
        this.stage.style.height = "";
        this.stage.style.width = "";
      }

      const components = splitForestComponents(forest);
      const seed =
        hashString(this.canonicalWord.join("")) + this.shuffleRound;
      const random = seededRandom(seed);
      const compactReadingLayout = this.layoutMode === "grid";
      const items = components.map((component) => ({
        component,
        layout: layoutComponent(component, compactReadingLayout),
      }));
      const orderedItems =
        this.layoutMode === "scatter"
          ? shuffledCopy(items, random)
          : items
              .map((item) => ({
                ...item,
                readingFootprint: componentVisualFootprint(
                  item,
                  this.flipped,
                ),
              }))
              .sort(compareReadingItems);
      const arrangement =
        this.layoutMode === "scatter"
          ? scatterPositions(orderedItems, random, this.viewport.clientWidth)
          : readingPositions(orderedItems, this.viewport.clientWidth);

      this.states = new Map();
      this.componentOrder = [];
      this.totalNodes = forest.vertices.length;
      this.totalEdges = forest.edges.length;
      this.canvas.setAttribute(
        "aria-label",
        `Weighted rooted forest with ${this.totalNodes} vertices, ` +
          `${this.totalEdges} edges, and ${components.length} components; ` +
          `roots ${this.flipped ? "below" : "above"}`,
      );
      for (
        let colorIndex = 0;
        colorIndex < orderedItems.length;
        colorIndex += 1
      ) {
        const item = orderedItems[colorIndex];
        const state = this.createComponentState(
          item.component,
          item.layout,
          arrangement.positions.get(item.component.root.id),
          colorIndex,
        );
        this.states.set(state.rootId, state);
        this.componentOrder.push(state.rootId);
      }
      this.worldWidth = arrangement.width;
      this.worldHeight = arrangement.height;
      if (this.layoutMode === "scatter") {
        this.captureScatterBoundary();
      } else {
        this.scatterBoundary = null;
        this.scatterMinimumZoom = minimumZoom;
      }
      this.resize();
      this.fitAll();
      this.simulationSleeping = true;
      this.requestDraw();
    }

    clear() {
      this.stopPhysics();
      this.forest = null;
      this.states.clear();
      this.componentOrder = [];
      this.totalNodes = 0;
      this.totalEdges = 0;
      this.lastVisibleComponentCount = 0;
      this.scatterBoundary = null;
      this.scatterMinimumZoom = minimumZoom;
      this.viewport.classList.remove("grid-scroll");
      this.zoomRange.disabled = false;
      this.zoomRange.setAttribute("aria-disabled", "false");
      this.sizer.style.height = "";
      this.sizer.style.width = "";
      this.stage.style.height = "";
      this.stage.style.width = "";
      this.context.clearRect(
        0,
        0,
        this.canvas.width,
        this.canvas.height,
      );
    }

    setLayout(layoutMode) {
      if (!this.forest) return;
      this.render(this.forest, this.canonicalWord, {
        layoutMode,
        shuffleRound: this.shuffleRound,
        flipped: this.flipped,
      });
    }

    refreshAppearance() {
      if (typeof getComputedStyle === "function") {
        const styles = getComputedStyle(this.viewport);
        const value = (property, fallback) =>
          styles.getPropertyValue(property).trim() || fallback;
        this.drawingColors = {
          edge: value("--forest-edge", "#7d8882"),
          labelBackground: value(
            "--forest-label-background",
            "#f4f2ea",
          ),
          labelLine: value("--forest-label-line", "#9da49d"),
          labelInk: value("--forest-label-ink", "#343b37"),
          nodeInk: value("--forest-node-ink", "#252b28"),
          dragStroke: value("--forest-drag-stroke", "#4f7782"),
          nodeShadow: value(
            "--forest-node-shadow",
            "rgba(49, 58, 53, 0.19)",
          ),
        };
      }
      this.requestDraw();
    }

    setFlipped(flipped) {
      const nextFlipped = Boolean(flipped);
      if (nextFlipped === this.flipped || !this.forest) {
        this.flipped = nextFlipped;
        return;
      }
      this.render(this.forest, this.canonicalWord, {
        layoutMode: this.layoutMode,
        shuffleRound: this.shuffleRound,
        flipped: nextFlipped,
      });
    }

    shuffle() {
      if (!this.forest) return;
      this.shuffleRound += 1;
      this.render(this.forest, this.canonicalWord, {
        layoutMode: this.layoutMode,
        shuffleRound: this.shuffleRound,
        flipped: this.flipped,
      });
    }

    createComponentState(component, layout, position, colorIndex) {
      const nodes = new Map();
      const nodeOrder = [];
      const color = colorForComponent(colorIndex);
      for (const vertex of component.vertices) {
        const initial = layout.positions.get(vertex.id);
        const initialY = this.flipped
          ? layout.height - initial.y
          : initial.y;
        nodes.set(vertex.id, {
          id: vertex.id,
          type: vertex.type,
          block: vertex.block,
          level: vertex.level,
          x: initial.x,
          y: initialY,
          restX: initial.x,
          restY: initialY,
          velocityX: 0,
          velocityY: 0,
          forceX: 0,
          forceY: 0,
          fill: color.fill,
          stroke: color.stroke,
        });
        nodeOrder.push(vertex.id);
      }

      const edges = component.edges.map((edge) => {
        const parent = nodes.get(edge.parent);
        const child = nodes.get(edge.child);
        const labelParts = edge.extension_class.split("^");
        return {
          parentId: edge.parent,
          childId: edge.child,
          restDeltaX: child.restX - parent.restX,
          restDeltaY: child.restY - parent.restY,
          labelBase: labelParts[0],
          labelExponent: labelParts[1] || "",
        };
      });
      const nodeValues = [...nodes.values()];
      const state = {
        rootId: component.root.id,
        colorIndex,
        position: { x: position.x, y: position.y },
        velocityX: 0,
        velocityY: 0,
        mass: Math.max(1, Math.sqrt(component.vertices.length)),
        nodes,
        nodeOrder,
        edges,
        restCentroidX:
          nodeValues.reduce((sum, node) => sum + node.restX, 0) /
          nodeValues.length,
        restCentroidY:
          nodeValues.reduce((sum, node) => sum + node.restY, 0) /
          nodeValues.length,
        localBounds: {
          minX: 0,
          minY: 0,
          maxX: layout.width,
          maxY: layout.height,
        },
      };
      this.updateLocalBounds(state);
      return state;
    }

    updateLocalBounds(state) {
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const node of state.nodes.values()) {
        minX = Math.min(minX, node.x - 50);
        minY = Math.min(minY, node.y - 33);
        maxX = Math.max(maxX, node.x + 50);
        maxY = Math.max(maxY, node.y + 33);
      }
      state.localBounds = { minX, minY, maxX, maxY };
    }

    componentBounds(state) {
      return {
        minX: state.position.x + state.localBounds.minX,
        minY: state.position.y + state.localBounds.minY,
        maxX: state.position.x + state.localBounds.maxX,
        maxY: state.position.y + state.localBounds.maxY,
      };
    }

    forestBounds() {
      if (this.states.size === 0) {
        return {
          minX: 0,
          minY: 0,
          maxX: this.worldWidth,
          maxY: this.worldHeight,
        };
      }
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const state of this.states.values()) {
        const bounds = this.componentBounds(state);
        minX = Math.min(minX, bounds.minX);
        minY = Math.min(minY, bounds.minY);
        maxX = Math.max(maxX, bounds.maxX);
        maxY = Math.max(maxY, bounds.maxY);
      }
      return { minX, minY, maxX, maxY };
    }

    captureScatterBoundary() {
      const bounds = this.forestBounds();
      const padding = 30;
      this.scatterBoundary = {
        minX: bounds.minX - padding,
        minY: bounds.minY - padding,
        maxX: bounds.maxX + padding,
        maxY: bounds.maxY + padding,
      };
      this.worldWidth = this.scatterBoundary.maxX - this.scatterBoundary.minX;
      this.worldHeight = this.scatterBoundary.maxY - this.scatterBoundary.minY;
    }

    calculateScatterFitZoom() {
      if (!this.scatterBoundary) return minimumZoom;
      const availableWidth = Math.max(1, this.viewportWidth - 36);
      const availableHeight = Math.max(1, this.viewportHeight - 36);
      const contentWidth = Math.max(
        1,
        this.scatterBoundary.maxX - this.scatterBoundary.minX,
      );
      const contentHeight = Math.max(
        1,
        this.scatterBoundary.maxY - this.scatterBoundary.minY,
      );
      return Math.max(
        minimumZoom,
        Math.min(
          1,
          availableWidth / contentWidth,
          availableHeight / contentHeight,
        ),
      );
    }

    minimumAllowedZoom() {
      if (this.layoutMode !== "scatter" || !this.scatterBoundary) {
        return minimumZoom;
      }
      return Math.min(maximumZoom, this.scatterMinimumZoom);
    }

    centerScatterBoundary() {
      if (!this.scatterBoundary) return;
      this.panX =
        this.viewportWidth / 2 -
        (this.scatterBoundary.minX + this.scatterBoundary.maxX) /
          2 * this.zoomLevel;
      this.panY =
        this.viewportHeight / 2 -
        (this.scatterBoundary.minY + this.scatterBoundary.maxY) /
          2 * this.zoomLevel;
    }

    constrainPanToScatterBoundary() {
      if (this.layoutMode !== "scatter" || !this.scatterBoundary) return;
      const clampAxis = (pan, viewportSize, minimum, maximum) => {
        const scaledMinimum = minimum * this.zoomLevel;
        const scaledMaximum = maximum * this.zoomLevel;
        if (scaledMaximum - scaledMinimum <= viewportSize) {
          return viewportSize / 2 - (minimum + maximum) / 2 * this.zoomLevel;
        }
        return Math.max(
          viewportSize - scaledMaximum,
          Math.min(-scaledMinimum, pan),
        );
      };
      this.panX = clampAxis(
        this.panX,
        this.viewportWidth,
        this.scatterBoundary.minX,
        this.scatterBoundary.maxX,
      );
      this.panY = clampAxis(
        this.panY,
        this.viewportHeight,
        this.scatterBoundary.minY,
        this.scatterBoundary.maxY,
      );
    }

    resize() {
      const width = Math.max(1, this.viewport.clientWidth);
      const height = Math.max(1, this.viewport.clientHeight);
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      if (
        width === this.viewportWidth &&
        height === this.viewportHeight &&
        ratio === this.devicePixelRatio
      ) {
        this.updateGridScrollSurface();
        this.requestDraw();
        return;
      }
      const wasAtScatterMinimum =
        this.layoutMode === "scatter" &&
        Math.abs(this.zoomLevel - this.scatterMinimumZoom) < 0.0001;
      this.viewportWidth = width;
      this.viewportHeight = height;
      this.devicePixelRatio = ratio;
      this.canvas.width = Math.ceil(width * ratio);
      this.canvas.height = Math.ceil(height * ratio);
      this.canvas.style.width = `${width}px`;
      this.canvas.style.height = `${height}px`;
      if (this.layoutMode === "grid" && this.forest) {
        this.fitGridWidth(false);
        return;
      }
      if (this.layoutMode === "scatter" && this.forest && this.scatterBoundary) {
        const nextMinimum = this.calculateScatterFitZoom();
        this.scatterMinimumZoom = nextMinimum;
        if (wasAtScatterMinimum || this.zoomLevel < nextMinimum) {
          this.zoomLevel = nextMinimum;
          this.centerScatterBoundary();
        } else {
          this.constrainPanToScatterBoundary();
        }
        this.updateZoomControl();
      }
      this.requestDraw();
    }

    fitAll() {
      if (this.layoutMode === "grid") {
        this.fitGridWidth(true);
        return;
      }
      if (!this.scatterBoundary) this.captureScatterBoundary();
      this.scatterMinimumZoom = this.calculateScatterFitZoom();
      this.zoomLevel = this.scatterMinimumZoom;
      this.centerScatterBoundary();
      this.updateZoomControl();
      this.requestDraw();
    }

    fitGridWidth(resetScroll = true) {
      const previousMaximumY = Math.max(
        1,
        this.sizer.scrollHeight - this.viewportHeight,
      );
      const previousProgressY =
        this.viewport.scrollTop / previousMaximumY;
      const availableWidth = Math.max(1, this.viewportWidth - 46);
      const bounds = this.forestBounds();
      const contentWidth = Math.max(1, bounds.maxX - bounds.minX);
      this.zoomLevel = Math.max(
        minimumZoom,
        Math.min(1, availableWidth / contentWidth),
      );
      this.panX =
        this.viewportWidth / 2 -
        (bounds.minX + bounds.maxX) / 2 * this.zoomLevel;
      this.panY = 18 - bounds.minY * this.zoomLevel;
      this.updateZoomControl();
      this.updateGridScrollSurface();
      const nextMaximumY = Math.max(
        0,
        this.sizer.scrollHeight - this.viewportHeight,
      );
      this.viewport.scrollTop = resetScroll
        ? 0
        : Math.min(nextMaximumY, previousProgressY * nextMaximumY);
      this.viewport.scrollLeft = 0;
      this.requestDraw();
    }

    updateGridScrollSurface() {
      if (this.layoutMode !== "grid" || !this.forest) return;
      const bounds = this.forestBounds();
      const contentHeight =
        (bounds.maxY - bounds.minY) * this.zoomLevel + 36;
      const scrollHeight = Math.max(
        this.viewportHeight,
        Math.ceil(contentHeight),
      );
      this.sizer.style.height = `${scrollHeight}px`;
      this.sizer.style.width = `${this.viewportWidth}px`;
      this.stage.style.height = `${this.viewportHeight}px`;
      this.stage.style.width = `${this.viewportWidth}px`;
    }

    setZoom(nextZoom, anchorClientX = null, anchorClientY = null) {
      if (this.layoutMode === "grid") return;
      const nextLevel = Math.max(
        this.minimumAllowedZoom(),
        Math.min(maximumZoom, nextZoom),
      );
      if (Math.abs(nextLevel - this.zoomLevel) < 0.00001) return;
      const bounds = this.viewport.getBoundingClientRect();
      const localX =
        anchorClientX === null
          ? this.viewportWidth / 2
          : anchorClientX - bounds.left;
      const localY =
        anchorClientY === null
          ? this.viewportHeight / 2
          : anchorClientY - bounds.top;
      const contentX = (localX - this.panX) / this.zoomLevel;
      const contentY = (localY - this.panY) / this.zoomLevel;
      this.zoomLevel = nextLevel;
      this.panX = localX - contentX * this.zoomLevel;
      this.panY = localY - contentY * this.zoomLevel;
      this.constrainPanToScatterBoundary();
      this.updateZoomControl();
      this.requestDraw();
    }

    updateZoomControl() {
      const rawPercentage = this.zoomLevel * 100;
      const percentage =
        rawPercentage < 1
          ? rawPercentage.toFixed(2)
          : rawPercentage < 10
            ? rawPercentage.toFixed(1)
            : String(Math.round(rawPercentage));
      const lowerZoom = this.minimumAllowedZoom();
      const zoomRange = maximumZoom / lowerZoom;
      const sliderPosition =
        zoomRange <= 1
          ? 0
          : Math.log(this.zoomLevel / lowerZoom) /
            Math.log(zoomRange) *
            100;
      this.zoomRange.value = sliderPosition.toFixed(1);
      this.zoomRange.setAttribute("aria-valuetext", `${percentage}%`);
      this.zoomLabel.textContent = `${percentage}%`;
    }

    clientToWorld(clientX, clientY) {
      const bounds = this.viewport.getBoundingClientRect();
      return {
        x: (clientX - bounds.left - this.panX) / this.zoomLevel,
        y: (clientY - bounds.top - this.panY) / this.zoomLevel,
      };
    }

    findNodeAt(worldX, worldY) {
      for (
        let componentIndex = this.componentOrder.length - 1;
        componentIndex >= 0;
        componentIndex -= 1
      ) {
        const rootId = this.componentOrder[componentIndex];
        const state = this.states.get(rootId);
        const bounds = this.componentBounds(state);
        if (
          worldX < bounds.minX ||
          worldX > bounds.maxX ||
          worldY < bounds.minY ||
          worldY > bounds.maxY
        ) {
          continue;
        }
        for (
          let nodeIndex = state.nodeOrder.length - 1;
          nodeIndex >= 0;
          nodeIndex -= 1
        ) {
          const node = state.nodes.get(state.nodeOrder[nodeIndex]);
          const nodeX = state.position.x + node.x;
          const nodeY = state.position.y + node.y;
          if (
            Math.abs(worldX - nodeX) <= 44 &&
            Math.abs(worldY - nodeY) <= 27
          ) {
            return { state, node };
          }
        }
      }
      return null;
    }

    clampNodeCenterToScatterBoundary(x, y) {
      if (this.layoutMode !== "scatter" || !this.scatterBoundary) {
        return { x, y };
      }
      const horizontalInset = 50;
      const verticalInset = 33;
      return {
        x: Math.max(
          this.scatterBoundary.minX + horizontalInset,
          Math.min(this.scatterBoundary.maxX - horizontalInset, x),
        ),
        y: Math.max(
          this.scatterBoundary.minY + verticalInset,
          Math.min(this.scatterBoundary.maxY - verticalInset, y),
        ),
      };
    }

    constrainElasticNodesToScatterBoundary(state) {
      if (this.layoutMode !== "scatter" || !this.scatterBoundary) return;
      for (const node of state.nodes.values()) {
        const globalX = state.position.x + node.x;
        const globalY = state.position.y + node.y;
        const clamped = this.clampNodeCenterToScatterBoundary(
          globalX,
          globalY,
        );
        if (clamped.x !== globalX) {
          node.x = clamped.x - state.position.x;
          node.velocityX = 0;
        }
        if (clamped.y !== globalY) {
          node.y = clamped.y - state.position.y;
          node.velocityY = 0;
        }
      }
    }

    constrainComponentToScatterBoundary(state) {
      if (this.layoutMode !== "scatter" || !this.scatterBoundary) return;
      const bounds = this.componentBounds(state);
      const boundaryWidth =
        this.scatterBoundary.maxX - this.scatterBoundary.minX;
      const boundaryHeight =
        this.scatterBoundary.maxY - this.scatterBoundary.minY;
      const componentWidth = bounds.maxX - bounds.minX;
      const componentHeight = bounds.maxY - bounds.minY;

      if (componentWidth >= boundaryWidth) {
        state.position.x +=
          (this.scatterBoundary.minX + this.scatterBoundary.maxX) / 2 -
          (bounds.minX + bounds.maxX) / 2;
        state.velocityX = 0;
      } else if (bounds.minX < this.scatterBoundary.minX) {
        state.position.x += this.scatterBoundary.minX - bounds.minX;
        state.velocityX = Math.max(0, state.velocityX);
      } else if (bounds.maxX > this.scatterBoundary.maxX) {
        state.position.x -= bounds.maxX - this.scatterBoundary.maxX;
        state.velocityX = Math.min(0, state.velocityX);
      }

      if (componentHeight >= boundaryHeight) {
        state.position.y +=
          (this.scatterBoundary.minY + this.scatterBoundary.maxY) / 2 -
          (bounds.minY + bounds.maxY) / 2;
        state.velocityY = 0;
      } else if (bounds.minY < this.scatterBoundary.minY) {
        state.position.y += this.scatterBoundary.minY - bounds.minY;
        state.velocityY = Math.max(0, state.velocityY);
      } else if (bounds.maxY > this.scatterBoundary.maxY) {
        state.position.y -= bounds.maxY - this.scatterBoundary.maxY;
        state.velocityY = Math.min(0, state.velocityY);
      }
    }

    startNodeDrag(event, hit) {
      const pointer = this.clientToWorld(event.clientX, event.clientY);
      const nodeGlobalX = hit.state.position.x + hit.node.x;
      const nodeGlobalY = hit.state.position.y + hit.node.y;
      this.interactionRootId = hit.state.rootId;
      this.physicsFramesRemaining = 0;
      this.stableTicks = 0;
      this.lastPhysicsTimestamp = 0;
      for (const state of this.states.values()) {
        state.velocityX = 0;
        state.velocityY = 0;
      }
      this.dragState = {
        pointerId: event.pointerId,
        rootId: hit.state.rootId,
        nodeId: hit.node.id,
        pointerOffsetX: nodeGlobalX - pointer.x,
        pointerOffsetY: nodeGlobalY - pointer.y,
        targetX: nodeGlobalX,
        targetY: nodeGlobalY,
        lastTargetX: nodeGlobalX,
        lastTargetY: nodeGlobalY,
        lastTime: performance.now(),
        releaseVelocityX: 0,
        releaseVelocityY: 0,
      };
      const orderIndex = this.componentOrder.indexOf(hit.state.rootId);
      if (orderIndex >= 0) {
        this.componentOrder.splice(orderIndex, 1);
        this.componentOrder.push(hit.state.rootId);
      }
      this.elasticComponentIds.add(hit.state.rootId);
      this.viewport.classList.add("node-dragging", "motion-active");
      this.viewport.setPointerCapture(event.pointerId);
      this.wakePhysics(64);
    }

    moveNodeDrag(event) {
      if (
        !this.dragState ||
        this.dragState.pointerId !== event.pointerId
      ) {
        return;
      }
      event.preventDefault();
      const pointer = this.clientToWorld(event.clientX, event.clientY);
      const target = this.clampNodeCenterToScatterBoundary(
        pointer.x + this.dragState.pointerOffsetX,
        pointer.y + this.dragState.pointerOffsetY,
      );
      const now = performance.now();
      const frameScale = 16 / Math.max(8, now - this.dragState.lastTime);
      this.dragState.releaseVelocityX = Math.max(
        -24,
        Math.min(
          24,
          (target.x - this.dragState.lastTargetX) * frameScale * 0.45,
        ),
      );
      this.dragState.releaseVelocityY = Math.max(
        -24,
        Math.min(
          24,
          (target.y - this.dragState.lastTargetY) * frameScale * 0.45,
        ),
      );
      Object.assign(this.dragState, {
        targetX: target.x,
        targetY: target.y,
        lastTargetX: target.x,
        lastTargetY: target.y,
        lastTime: now,
      });
      const state = this.states.get(this.dragState.rootId);
      const node = state.nodes.get(this.dragState.nodeId);
      node.x = target.x - state.position.x;
      node.y = target.y - state.position.y;
      this.updateLocalBounds(state);
      this.wakePhysics(48);
      this.requestDraw();
    }

    finishNodeDrag(event) {
      const state = this.states.get(this.dragState.rootId);
      const node = state.nodes.get(this.dragState.nodeId);
      node.x = this.dragState.targetX - state.position.x;
      node.y = this.dragState.targetY - state.position.y;
      this.constrainElasticNodesToScatterBoundary(state);
      node.velocityX = this.dragState.releaseVelocityX;
      node.velocityY = this.dragState.releaseVelocityY;
      this.dragState = null;
      this.viewport.classList.remove("node-dragging");
      if (
        !this.viewport.hasPointerCapture ||
        this.viewport.hasPointerCapture(event.pointerId)
      ) {
        this.viewport.releasePointerCapture(event.pointerId);
      }
      this.elasticComponentIds.add(state.rootId);
      this.wakePhysics(72);
    }

    startPan(event) {
      this.panState = {
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startPanX: this.panX,
        startPanY: this.panY,
      };
      this.viewport.classList.add("panning");
      this.viewport.setPointerCapture(event.pointerId);
    }

    movePan(event) {
      if (!this.panState || this.panState.pointerId !== event.pointerId) {
        return;
      }
      event.preventDefault();
      this.panX =
        this.panState.startPanX +
        event.clientX -
        this.panState.startClientX;
      this.panY =
        this.panState.startPanY +
        event.clientY -
        this.panState.startClientY;
      this.constrainPanToScatterBoundary();
      this.requestDraw();
    }

    finishPan(event) {
      this.panState = null;
      this.viewport.classList.remove("panning");
      if (
        !this.viewport.hasPointerCapture ||
        this.viewport.hasPointerCapture(event.pointerId)
      ) {
        this.viewport.releasePointerCapture(event.pointerId);
      }
    }

    stepElasticComponent(state) {
      const pinnedNodeId =
        this.dragState && this.dragState.rootId === state.rootId
          ? this.dragState.nodeId
          : null;
      const pinnedNode =
        pinnedNodeId === null ? null : state.nodes.get(pinnedNodeId);
      if (pinnedNode) {
        pinnedNode.x = this.dragState.targetX - state.position.x;
        pinnedNode.y = this.dragState.targetY - state.position.y;
        pinnedNode.velocityX = 0;
        pinnedNode.velocityY = 0;
      }

      for (const node of state.nodes.values()) {
        node.forceX = 0;
        node.forceY = 0;
      }
      for (const edge of state.edges) {
        const parent = state.nodes.get(edge.parentId);
        const child = state.nodes.get(edge.childId);
        const errorX = child.x - parent.x - edge.restDeltaX;
        const errorY = child.y - parent.y - edge.restDeltaY;
        const forceX = errorX * 0.055;
        const forceY = errorY * 0.055;
        parent.forceX += forceX;
        parent.forceY += forceY;
        child.forceX -= forceX;
        child.forceY -= forceY;
      }

      const nodes = [...state.nodes.values()];
      const centroidX =
        nodes.reduce((sum, node) => sum + node.x, 0) / nodes.length;
      const centroidY =
        nodes.reduce((sum, node) => sum + node.y, 0) / nodes.length;
      const translationX = centroidX - state.restCentroidX;
      const translationY = centroidY - state.restCentroidY;
      for (const node of nodes) {
        node.forceX +=
          (node.restX + translationX - node.x) * 0.012;
        node.forceY +=
          (node.restY + translationY - node.y) * 0.012;
      }

      let maxSpeed = 0;
      for (const node of nodes) {
        if (node.id === pinnedNodeId) continue;
        node.velocityX = (node.velocityX + node.forceX) * 0.82;
        node.velocityY = (node.velocityY + node.forceY) * 0.82;
        const speed = Math.hypot(node.velocityX, node.velocityY);
        if (speed > 26) {
          node.velocityX = node.velocityX / speed * 26;
          node.velocityY = node.velocityY / speed * 26;
        }
        node.x += node.velocityX;
        node.y += node.velocityY;
        maxSpeed = Math.max(maxSpeed, speed);
      }
      this.resolveNodeCollisions(state, pinnedNodeId);
      if (pinnedNode) {
        pinnedNode.x = this.dragState.targetX - state.position.x;
        pinnedNode.y = this.dragState.targetY - state.position.y;
      }
      this.constrainElasticNodesToScatterBoundary(state);
      this.updateLocalBounds(state);
      return maxSpeed;
    }

    resolveNodeCollisions(state, pinnedNodeId) {
      const nodes = [...state.nodes.values()];
      for (let iteration = 0; iteration < 3; iteration += 1) {
        let collisions = 0;
        for (let firstIndex = 0; firstIndex < nodes.length; firstIndex += 1) {
          const first = nodes[firstIndex];
          for (
            let secondIndex = firstIndex + 1;
            secondIndex < nodes.length;
            secondIndex += 1
          ) {
            const second = nodes[secondIndex];
            const deltaX = first.x - second.x;
            const deltaY = first.y - second.y;
            const overlapX = 96 - Math.abs(deltaX);
            const overlapY = 66 - Math.abs(deltaY);
            if (overlapX <= 0 || overlapY <= 0) continue;
            collisions += 1;
            const firstPinned = first.id === pinnedNodeId;
            const secondPinned = second.id === pinnedNodeId;
            const tieDirection =
              hashString(`${first.id}:${second.id}`) % 2 === 0 ? -1 : 1;
            if (overlapX <= overlapY) {
              const direction =
                deltaX === 0 ? tieDirection : Math.sign(deltaX);
              const correction = overlapX * 0.58 + 0.5;
              if (firstPinned) {
                second.x -= direction * correction;
              } else if (secondPinned) {
                first.x += direction * correction;
              } else {
                first.x += direction * correction / 2;
                second.x -= direction * correction / 2;
              }
            } else {
              const direction =
                deltaY === 0 ? tieDirection : Math.sign(deltaY);
              const correction = overlapY * 0.58 + 0.5;
              if (firstPinned) {
                second.y -= direction * correction;
              } else if (secondPinned) {
                first.y += direction * correction;
              } else {
                first.y += direction * correction / 2;
                second.y -= direction * correction / 2;
              }
            }
          }
        }
        if (collisions === 0) break;
      }
    }

    buildSpatialIndex(anchorRootId = null) {
      const allData = this.componentOrder.map((rootId) => {
        const state = this.states.get(rootId);
        const bounds = this.componentBounds(state);
        return {
          state,
          bounds,
          centerX: (bounds.minX + bounds.maxX) / 2,
          centerY: (bounds.minY + bounds.maxY) / 2,
        };
      });
      let data = allData;
      if (anchorRootId !== null) {
        const anchor = allData.find(
          (item) => item.state.rootId === anchorRootId,
        );
        if (anchor) {
          data = allData.filter(
            (item) =>
              item === anchor ||
              rectangleDistance(anchor.bounds, item.bounds) <=
                localPhysicsPadding,
          );
        }
      }
      data.forEach((item, index) => {
        item.index = index;
      });
      const cellSize = 360;
      const interactionPadding =
        componentRepulsionRange + componentCollisionGap;
      const cells = new Map();
      for (const item of data) {
        const minCellX = Math.floor(
          (item.bounds.minX - interactionPadding) / cellSize,
        );
        const maxCellX = Math.floor(
          (item.bounds.maxX + interactionPadding) / cellSize,
        );
        const minCellY = Math.floor(
          (item.bounds.minY - interactionPadding) / cellSize,
        );
        const maxCellY = Math.floor(
          (item.bounds.maxY + interactionPadding) / cellSize,
        );
        for (let cellX = minCellX; cellX <= maxCellX; cellX += 1) {
          for (let cellY = minCellY; cellY <= maxCellY; cellY += 1) {
            const key = `${cellX}:${cellY}`;
            if (!cells.has(key)) cells.set(key, []);
            cells.get(key).push(item.index);
          }
        }
      }

      const pairKeys = new Set();
      const pairs = [];
      for (const indices of cells.values()) {
        for (let first = 0; first < indices.length; first += 1) {
          for (let second = first + 1; second < indices.length; second += 1) {
            const left = Math.min(indices[first], indices[second]);
            const right = Math.max(indices[first], indices[second]);
            const pairKey = left * data.length + right;
            if (pairKeys.has(pairKey)) continue;
            pairKeys.add(pairKey);
            pairs.push([data[left], data[right]]);
          }
        }
      }
      return { data, pairs };
    }

    buildLocalRootSet(spatialIndex) {
      const localRoots = new Set();
      if (this.interactionRootId === null) return localRoots;
      const anchor = spatialIndex.data.find(
        (item) => item.state.rootId === this.interactionRootId,
      );
      if (!anchor) return localRoots;
      for (const item of spatialIndex.data) {
        if (
          item === anchor ||
          rectangleDistance(anchor.bounds, item.bounds) <=
            localPhysicsPadding
        ) {
          localRoots.add(item.state.rootId);
        }
      }
      return localRoots;
    }

    applyComponentForces(fixedRootId, spatialIndex, localRoots) {
      for (const item of spatialIndex.data) {
        item.forceX = 0;
        item.forceY = 0;
        if (!localRoots.has(item.state.rootId)) {
          item.state.velocityX = 0;
          item.state.velocityY = 0;
        }
      }
      for (const [first, second] of spatialIndex.pairs) {
        if (
          !localRoots.has(first.state.rootId) ||
          !localRoots.has(second.state.rootId)
        ) {
          continue;
        }
        const separation = rectangleDistance(first.bounds, second.bounds);
        if (separation >= componentRepulsionRange) continue;
        let deltaX = first.centerX - second.centerX;
        let deltaY = first.centerY - second.centerY;
        let distance = Math.hypot(deltaX, deltaY);
        if (distance < 0.001) {
          const direction =
            hashString(
              `${first.state.rootId}:${second.state.rootId}`,
            ) %
              2 ===
            0
              ? -1
              : 1;
          deltaX = direction;
          deltaY = 0;
          distance = 1;
        }
        const pressure =
          Math.pow(
            1 - separation / componentRepulsionRange,
            1.6,
          ) * 0.22;
        const directionX = deltaX / distance;
        const directionY = deltaY / distance;
        const firstFixed = first.state.rootId === fixedRootId;
        const secondFixed = second.state.rootId === fixedRootId;
        if (firstFixed) {
          second.forceX -= directionX * pressure * 1.6;
          second.forceY -= directionY * pressure * 1.6;
        } else if (secondFixed) {
          first.forceX += directionX * pressure * 1.6;
          first.forceY += directionY * pressure * 1.6;
        } else {
          first.forceX += directionX * pressure / first.state.mass;
          first.forceY += directionY * pressure / first.state.mass;
          second.forceX -= directionX * pressure / second.state.mass;
          second.forceY -= directionY * pressure / second.state.mass;
        }
      }

      let maxSpeed = 0;
      for (const item of spatialIndex.data) {
        const state = item.state;
        if (!localRoots.has(state.rootId)) continue;
        if (state.rootId === fixedRootId) {
          state.velocityX = 0;
          state.velocityY = 0;
          continue;
        }
        state.velocityX = (state.velocityX + item.forceX) * 0.84;
        state.velocityY = (state.velocityY + item.forceY) * 0.84;
        state.velocityX = Math.max(-2.5, Math.min(2.5, state.velocityX));
        state.velocityY = Math.max(-2.5, Math.min(2.5, state.velocityY));
        state.position.x += state.velocityX;
        state.position.y += state.velocityY;
        this.constrainComponentToScatterBoundary(state);
        maxSpeed = Math.max(
          maxSpeed,
          Math.hypot(state.velocityX, state.velocityY),
        );
      }
      return maxSpeed;
    }

    resolveComponentConstraints(
      fixedRootId,
      spatialIndex,
      localRoots,
      iterations,
      strength,
    ) {
      let totalCollisions = 0;
      for (let iteration = 0; iteration < iterations; iteration += 1) {
        let collisions = 0;
        for (const [firstItem, secondItem] of spatialIndex.pairs) {
          const first = firstItem.state;
          const second = secondItem.state;
          if (
            !localRoots.has(first.rootId) ||
            !localRoots.has(second.rootId)
          ) {
            continue;
          }
          const firstBounds = this.componentBounds(first);
          const secondBounds = this.componentBounds(second);
          const firstCenterX = (firstBounds.minX + firstBounds.maxX) / 2;
          const firstCenterY = (firstBounds.minY + firstBounds.maxY) / 2;
          const secondCenterX = (secondBounds.minX + secondBounds.maxX) / 2;
          const secondCenterY = (secondBounds.minY + secondBounds.maxY) / 2;
          const overlapX =
            (firstBounds.maxX - firstBounds.minX +
              secondBounds.maxX - secondBounds.minX) /
              2 +
            componentCollisionGap -
            Math.abs(firstCenterX - secondCenterX);
          const overlapY =
            (firstBounds.maxY - firstBounds.minY +
              secondBounds.maxY - secondBounds.minY) /
              2 +
            componentCollisionGap -
            Math.abs(firstCenterY - secondCenterY);
          if (overlapX <= 0 || overlapY <= 0) continue;
          collisions += 1;
          const firstFixed = first.rootId === fixedRootId;
          const secondFixed = second.rootId === fixedRootId;
          const tieDirection =
            hashString(`${first.rootId}:${second.rootId}`) % 2 === 0
              ? -1
              : 1;
          const totalMass = first.mass + second.mass;
          const firstShare = second.mass / totalMass;
          const secondShare = first.mass / totalMass;
          if (overlapX <= overlapY) {
            const deltaX = firstCenterX - secondCenterX;
            const direction =
              deltaX === 0 ? tieDirection : Math.sign(deltaX);
            const correction = overlapX * strength + 0.5;
            if (firstFixed) {
              second.position.x -= direction * correction;
            } else if (secondFixed) {
              first.position.x += direction * correction;
            } else {
              first.position.x += direction * correction * firstShare;
              second.position.x -= direction * correction * secondShare;
            }
          } else {
            const deltaY = firstCenterY - secondCenterY;
            const direction =
              deltaY === 0 ? tieDirection : Math.sign(deltaY);
            const correction = overlapY * strength + 0.5;
            if (firstFixed) {
              second.position.y -= direction * correction;
            } else if (secondFixed) {
              first.position.y += direction * correction;
            } else {
              first.position.y += direction * correction * firstShare;
              second.position.y -= direction * correction * secondShare;
            }
          }
        }
        totalCollisions += collisions;
        for (const rootId of localRoots) {
          const state = this.states.get(rootId);
          if (!state) continue;
          if (state.rootId === fixedRootId) continue;
          this.constrainComponentToScatterBoundary(state);
        }
        if (collisions === 0) break;
      }
      return totalCollisions;
    }

    wakePhysics(frames = 0) {
      this.physicsFramesRemaining = Math.max(
        this.physicsFramesRemaining,
        frames,
      );
      this.stableTicks = 0;
      if (this.simulationSleeping) {
        this.simulationSleeping = false;
        this.viewport.classList.add("motion-active");
        this.requestDraw();
      }
      if (this.physicsFrame === null) {
        this.physicsFrame = requestAnimationFrame((timestamp) =>
          this.physicsTick(timestamp),
        );
      }
    }

    physicsTick(timestamp) {
      this.physicsFrame = null;
      if (!this.forest) return;
      const minimumFrameInterval =
        this.states.size > 1500
          ? 50
          : this.states.size > 400
            ? 40
            : 30;
      if (
        this.lastPhysicsTimestamp !== 0 &&
        timestamp - this.lastPhysicsTimestamp < minimumFrameInterval
      ) {
        this.physicsFrame = requestAnimationFrame((nextTimestamp) =>
          this.physicsTick(nextTimestamp),
        );
        return;
      }
      this.lastPhysicsTimestamp = timestamp;

      let maxNodeSpeed = 0;
      for (const rootId of this.elasticComponentIds) {
        const state = this.states.get(rootId);
        if (state) {
          maxNodeSpeed = Math.max(
            maxNodeSpeed,
            this.stepElasticComponent(state),
          );
        }
      }

      const fixedRootId = this.dragState ? this.dragState.rootId : null;
      const spatialIndex = this.buildSpatialIndex(this.interactionRootId);
      const localRoots = this.buildLocalRootSet(spatialIndex);
      let maxComponentSpeed = 0;
      if (this.layoutMode === "scatter") {
        maxComponentSpeed = this.applyComponentForces(
          fixedRootId,
          spatialIndex,
          localRoots,
        );
      }
      const collisions = this.resolveComponentConstraints(
        fixedRootId,
        spatialIndex,
        localRoots,
        this.dragState ? 4 : 2,
        this.dragState ? 0.76 : 0.68,
      );
      this.updateWorldBounds(false);
      this.physicsFramesRemaining = Math.max(
        0,
        this.physicsFramesRemaining - 1,
      );

      if (!this.dragState && maxNodeSpeed < 0.04) {
        for (const rootId of this.elasticComponentIds) {
          const state = this.states.get(rootId);
          if (!state) continue;
          for (const node of state.nodes.values()) {
            node.velocityX = 0;
            node.velocityY = 0;
          }
        }
        this.elasticComponentIds.clear();
      }

      const maxMotion = Math.max(maxNodeSpeed, maxComponentSpeed);
      if (!this.dragState && collisions === 0 && maxMotion < 0.075) {
        this.stableTicks += 1;
      } else {
        this.stableTicks = 0;
      }

      this.requestDraw();
      if (
        !this.dragState &&
        (this.stableTicks >= 18 || this.physicsFramesRemaining === 0)
      ) {
        this.simulationSleeping = true;
        this.viewport.classList.remove("motion-active");
        for (const state of this.states.values()) {
          state.velocityX = 0;
          state.velocityY = 0;
        }
        this.interactionRootId = null;
        this.updateWorldBounds(true);
        this.requestDraw();
        return;
      }
      this.physicsFrame = requestAnimationFrame((nextTimestamp) =>
        this.physicsTick(nextTimestamp),
      );
    }

    stopPhysics() {
      if (this.physicsFrame !== null) {
        cancelAnimationFrame(this.physicsFrame);
      }
      if (this.drawFrame !== null) {
        cancelAnimationFrame(this.drawFrame);
      }
      this.physicsFrame = null;
      this.drawFrame = null;
      this.physicsFramesRemaining = 0;
      this.lastPhysicsTimestamp = 0;
      this.stableTicks = 0;
      this.simulationSleeping = true;
      this.interactionRootId = null;
      this.elasticComponentIds.clear();
      this.viewport.classList.remove("motion-active");
    }

    updateWorldBounds(allowShrink) {
      if (this.layoutMode === "scatter" && this.scatterBoundary) return;
      let requiredWidth = 920;
      let requiredHeight = 440;
      for (const state of this.states.values()) {
        const bounds = this.componentBounds(state);
        requiredWidth = Math.max(requiredWidth, bounds.maxX + 84);
        requiredHeight = Math.max(requiredHeight, bounds.maxY + 84);
      }
      if (
        requiredWidth > this.worldWidth ||
        requiredHeight > this.worldHeight ||
        (allowShrink &&
          (Math.abs(requiredWidth - this.worldWidth) > 24 ||
            Math.abs(requiredHeight - this.worldHeight) > 24))
      ) {
        this.worldWidth = requiredWidth;
        this.worldHeight = requiredHeight;
      }
    }

    requestDraw() {
      if (this.drawFrame !== null) return;
      this.drawFrame = requestAnimationFrame(() => {
        this.drawFrame = null;
        this.draw();
      });
    }

    draw() {
      const context = this.context;
      const ratio = this.devicePixelRatio;
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      if (!this.forest) return;
      const gridMode = this.layoutMode === "grid";
      const scrollOffsetY = gridMode ? this.viewport.scrollTop : 0;
      const effectivePanX = this.panX;
      const effectivePanY = this.panY - scrollOffsetY;
      context.setTransform(
        ratio * this.zoomLevel,
        0,
        0,
        ratio * this.zoomLevel,
        ratio * effectivePanX,
        ratio * effectivePanY,
      );

      const viewBounds = {
        minX: (-effectivePanX) / this.zoomLevel - 120,
        minY: (-effectivePanY) / this.zoomLevel - 120,
        maxX:
          (this.viewportWidth - effectivePanX) / this.zoomLevel + 120,
        maxY:
          (this.viewportHeight - effectivePanY) / this.zoomLevel + 120,
      };
      const moving = !this.simulationSleeping || Boolean(this.dragState);
      const showEdgeLabels =
        gridMode || (!moving && this.zoomLevel >= 0.58);
      const showNodeLabels =
        this.zoomLevel >= 0.2 && (!moving || this.totalNodes <= 500);
      const compactNodeLabels = this.zoomLevel < 0.72;
      const useShadows =
        this.simulationSleeping && !this.dragState && this.zoomLevel >= 0.28;

      let visibleComponentCount = 0;
      for (const rootId of this.componentOrder) {
        const state = this.states.get(rootId);
        const bounds = this.componentBounds(state);
        if (
          bounds.maxX < viewBounds.minX ||
          bounds.minX > viewBounds.maxX ||
          bounds.maxY < viewBounds.minY ||
          bounds.minY > viewBounds.maxY
        ) {
          continue;
        }
        visibleComponentCount += 1;
        this.drawComponent(
          context,
          state,
          showEdgeLabels,
          showNodeLabels,
          compactNodeLabels,
          useShadows,
          gridMode,
        );
      }
      this.lastVisibleComponentCount = visibleComponentCount;
    }

    drawNodeFinish(context, node) {
      const left = node.x - 41;
      const top = node.y - 24;
      const width = 82;
      const height = 48;
      context.save();
      roundedRect(context, left, top, width, height, 7);
      context.clip();
      const finish = context.createLinearGradient(
        left,
        top,
        left + width,
        top + height,
      );
      finish.addColorStop(0, "rgba(255, 255, 250, 0.28)");
      finish.addColorStop(0.46, "rgba(255, 255, 250, 0.06)");
      finish.addColorStop(1, "rgba(47, 58, 52, 0.055)");
      context.fillStyle = finish;
      context.fillRect(left, top, width, height);
      context.beginPath();
      context.moveTo(left + 6, top + 5);
      context.lineTo(left + width - 6, top + 5);
      context.strokeStyle = "rgba(255, 255, 250, 0.24)";
      context.lineWidth = 1;
      context.stroke();
      context.restore();
    }

    drawComponent(
      context,
      state,
      showEdgeLabels,
      showNodeLabels,
      compactNodeLabels,
      useShadows,
      gridMode,
    ) {
      context.save();
      context.translate(state.position.x, state.position.y);
      const edgeLineWidth = Math.max(
        1.25,
        Math.min(12, 0.68 / this.zoomLevel),
      );
      const nodeLineWidth = Math.max(
        1.25,
        Math.min(10, 0.62 / this.zoomLevel),
      );
      context.lineWidth = edgeLineWidth;
      context.strokeStyle = this.drawingColors.edge;
      for (const edge of state.edges) {
        const parent = state.nodes.get(edge.parentId);
        const child = state.nodes.get(edge.childId);
        const direction = child.y >= parent.y ? 1 : -1;
        const startY = parent.y + direction * 27;
        const endY = child.y - direction * 27;
        const midY = (startY + endY) / 2;
        context.beginPath();
        context.moveTo(parent.x, startY);
        context.bezierCurveTo(
          parent.x,
          midY,
          child.x,
          midY,
          child.x,
          endY,
        );
        context.stroke();

        if (showEdgeLabels) {
          const edgeLabelT = 0.66;
          const labelX = cubicBezierCoordinate(
            parent.x,
            parent.x,
            child.x,
            child.x,
            edgeLabelT,
          );
          const labelY =
            cubicBezierCoordinate(
              startY,
              midY,
              midY,
              endY,
              edgeLabelT,
            ) - 2;
          const edgeLabelScale = gridMode
            ? Math.max(
                1,
                Math.min(2.5, 0.8 / this.zoomLevel),
              )
            : 1;
          const labelWidth = 44 * edgeLabelScale;
          const labelHeight = 23 * edgeLabelScale;
          context.save();
          roundedRect(
            context,
            labelX - labelWidth / 2,
            labelY - labelHeight * 0.56,
            labelWidth,
            labelHeight,
            5 * edgeLabelScale,
          );
          context.fillStyle = this.drawingColors.labelBackground;
          context.fill();
          context.strokeStyle = this.drawingColors.labelLine;
          context.lineWidth = 1;
          context.stroke();
          context.fillStyle = this.drawingColors.labelInk;
          context.textAlign = "center";
          context.font =
            `italic ${13 * edgeLabelScale}px ` +
            "KaTeX_Main, 'Times New Roman', serif";
          context.fillText(
            edge.labelBase,
            labelX - 2 * edgeLabelScale,
            labelY + 4 * edgeLabelScale,
          );
          if (edge.labelExponent) {
            context.font =
              `${11.5 * edgeLabelScale}px ` +
              "KaTeX_Main, 'Times New Roman', serif";
            context.fillText(
              edge.labelExponent,
              labelX + 8 * edgeLabelScale,
              labelY - 4 * edgeLabelScale,
            );
          }
          context.restore();
        }
      }

      for (const nodeId of state.nodeOrder) {
        const node = state.nodes.get(nodeId);
        const isDragged =
          this.dragState &&
          this.dragState.rootId === state.rootId &&
          this.dragState.nodeId === node.id;
        context.save();
        if (useShadows) {
          context.shadowColor = this.drawingColors.nodeShadow;
          context.shadowBlur = 9;
          context.shadowOffsetY = 3;
        }
        roundedRect(context, node.x - 44, node.y - 27, 88, 54, 9);
        context.fillStyle = node.fill;
        context.fill();
        context.shadowColor = "transparent";
        this.drawNodeFinish(context, node);
        roundedRect(context, node.x - 44, node.y - 27, 88, 54, 9);
        context.strokeStyle = isDragged
          ? this.drawingColors.dragStroke
          : node.stroke;
        context.lineWidth = isDragged
          ? Math.max(2.2, nodeLineWidth * 1.35)
          : nodeLineWidth;
        context.stroke();
        if (showNodeLabels) {
          context.fillStyle = this.drawingColors.nodeInk;
          const typeText = String(node.type);
          if (compactNodeLabels) {
            const fontSize = Math.max(
              18,
              Math.min(54, 10 / this.zoomLevel),
            );
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.font =
              `${fontSize}px KaTeX_Main, 'Times New Roman', serif`;
            context.fillText(typeText, node.x, node.y + 1);
          } else {
            context.textAlign = "left";
            context.textBaseline = "alphabetic";
            context.font =
              "italic 19px KaTeX_Main, 'Times New Roman', serif";
            const baseWidth = context.measureText("U").width;
            context.font = "11px KaTeX_Main, 'Times New Roman', serif";
            const subscriptWidth = context.measureText(typeText).width;
            const startX = node.x - (baseWidth + subscriptWidth) / 2;
            context.font =
              "italic 19px KaTeX_Main, 'Times New Roman', serif";
            context.fillText("U", startX, node.y + 6);
            context.font = "11px KaTeX_Main, 'Times New Roman', serif";
            context.fillText(
              typeText,
              startX + baseWidth,
              node.y + 11,
            );
          }
        }
        context.restore();
      }
      context.restore();
    }

    getDebugStats() {
      const spatialIndex = this.buildSpatialIndex();
      const componentCount = this.componentOrder.length;
      return {
        componentCount,
        nodeCount: this.totalNodes,
        edgeCount: this.totalEdges,
        candidatePairs: spatialIndex.pairs.length,
        allPairs: componentCount * (componentCount - 1) / 2,
        visibleComponents: this.lastVisibleComponentCount,
        sleeping: this.simulationSleeping,
      };
    }
  }

  window.ForestRenderer = ForestRenderer;
})();
