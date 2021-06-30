// -------------------------------------------------------------------
class Smuggler extends Intermediary{
  constructor( id, loc, home, boundaries, diameter){
    super( id, loc, home, diameter, color("#d34b84") );
    this.stepSize = 3;
    this.vision = 10;
    
    this.fees = random( bahtToFloat(5000), bahtToFloat(10000));
    this.passengerCurrent = [];
    this.passengerMinimum = floor(random(4,7)); //4-6
    this.boundaries = boundaries;
    
    this.setupOffer();
  } 
  
  
  setupOffer(ls, emps){    
    let weightedDestinations = [ "Bangkok", "Bangkok", "Bangkok", "Bangkok", "Bangkok", "Phang Nga", "Phang Nga", "Phang Nga", "Tak", "Tak" ];
    this.offer = new Offer( null, random(weightedDestinations), ["none"], this.id, "unofficial2" );
  }
  
  
  makeOffer(ms){

  }

  sendPassengers( ){
    if( this.passengerCurrent.length >= this.passengerMinimum ){
      for( let i=0; i < this.passengerCurrent.length; i++ ){
        migrants[ this.passengerCurrent[i] ].migrations[0].leaveSmuggler = true;
      }
      this.passengerCurrent = [];
    }
  }
  
  
  walk(){ 
    this.loc = this.randomWalk( this.loc, this.stepSize, this.boundaries );
    this.sendPassengers(); 
  } 
  
  
  // --- Class methods ------------------------
 
  static setupPopulation( ims, cdisS, esa){
    for (const [k, v] of Object.entries( cdisS )) {
      let home = esa[k];
      for(let i=0; i< v; i++){
        let id = `i${ims.length}`;
        let boundaries = [createVector(home.boundaries[0].x, esa["Yangon"].boundaries[0].y,home.boundaries[1].y), home.boundaries[1]];
        let loc =  createVector( 
          random( boundaries[0].x + 25, boundaries[1].x - 25), 
          random( boundaries[0].y + 25, boundaries[1].y - 25) 
        );
        ims.push( new Smuggler( id, loc, k, boundaries, 7 ) );
      }
    }
  }
  
}
