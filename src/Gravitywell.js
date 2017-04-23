var Gravitywell = function(){

  //added gravity struct
  var GravitywellStruct = function GravityStruct() {
      this.x = 0;
      this.y = 0;
      this.dx = 0;
      this.dy = 0;
      this.coords = new THREE.Vector2();
      this.buttons = [];
  };

  // PUBLIC FUNCTIONS

  this.getLength = function() {
      return _gravitywellStruct.length;
  };

  this.getGravitywell = function(idx) {

      return new GravitywellStruct();
  };
}

export default Gravitywell
