// -------------------------------------------------------------------
class ThailandDocumentBroker extends Intermediary{
  constructor( id, loc, home, diameter){
    super( id, loc, home, diameter, color("#ff920d") );
    this.stepSize = 10;
    this.vision = 10;
    
    this.fees = random( bahtToFloat(4000), bahtToFloat(10000));
    this.completionRate = random(0.5,1);
  }

  setupOffer(ls, emps){    
    this.offer = new Offer( null, "", random([ ["passport"], ["work permit"], ["passport","work permit"] ]), "", "official" );
  }
  
  //  30. intermediary unsolicited offer rule
  makeOffer(ms){

  }
  
  
  // --- Class methods ------------------------
  
  static setupPopulation( ims, cdisTDB, esa){
    for (const [k, v] of Object.entries( cdisTDB )) {
      let home = esa[k];
      for(let i=0; i<v; i++){
        let id = `i${ims.length}`; 
        let loc =  createVector( 
          random( home.boundaries[0].x +25, home.boundaries[1].x -25), 
          random( home.boundaries[0].y +25, home.boundaries[1].y -25) 
        );
        ims.push( new ThailandDocumentBroker( id, loc, k, 7 ) );
      }
    }
  }
  
}
