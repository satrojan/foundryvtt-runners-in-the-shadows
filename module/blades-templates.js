/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function() {

  // Define template paths to load
  const templatePaths = [

    // Actor Sheet Partials
    "systems/runners-in-the-shadows/templates/parts/coins.html",
    "systems/runners-in-the-shadows/templates/parts/attributes.html",
    "systems/runners-in-the-shadows/templates/parts/turf-list.html",
    "systems/runners-in-the-shadows/templates/parts/cohort-block.html",
    "systems/runners-in-the-shadows/templates/parts/factions.html",
    "systems/runners-in-the-shadows/templates/parts/active-effects.html",
  ];

  // Load the template parts
  return loadTemplates(templatePaths);
};
