/**
 * Maps each member's JSON "id" to their photo file in this same
 * assets folder. React Native needs require() to be called with a
 * literal, hardcoded path — it cannot resolve a variable/string
 * path at runtime — so every member needs one explicit line here.
 *
 * IMPORTANT: rename the filenames below (right-hand side) to match
 * whatever your actual image files are called in
 * .../Frontend/src/assets — the id keys (left-hand side) already
 * match the "id" values in institutionTree.json, so don't change
 * those unless you also change the JSON.
 *
 * To add a photo for a new member later (e.g. for the Pink
 * Committee), drop the image file in this folder and add one more
 * line here with that member's id.
 */

const memberPhotos = {
  "member-1": require("./../assets/memberPhotos/member-1.png"),
  "member-2": require("./../assets/memberPhotos/member-2.png"),
  "member-3": require("./../assets/memberPhotos/member-3.png"),
  "member-4": require("./../assets/memberPhotos/member-4.png"),
  "member-5": require("./../assets/memberPhotos/member-5.png"),
  "member-6": require("./../assets/memberPhotos/member-6.png"),
  "member-7": require("./../assets/memberPhotos/member-7.png"),
};


export default memberPhotos;