(function () {
  'use strict';
  const W = window.NEO;
  W.craftRecipe = r => {
    for (const inp of r.inputs) if (!W.hasItem(inp.item, inp.count)) return false;
    for (const inp of r.inputs) W.removeItem(inp.item, inp.count);
    W.addItem(r.output.item, r.output.count);
    return true;
  };
})();
