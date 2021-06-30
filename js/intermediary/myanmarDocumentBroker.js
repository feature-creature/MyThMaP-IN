// -------------------------------------------------------------------
class MyanmarDocumentBroker extends Intermediary{
  constructor( id, loc, home, office, officeRadius, diameter ){
    super( id, loc, home, diameter, color("#3f4d84") );
    this.stepSize = 1;
    this.vision = 10;
    
    this.fees = random( bahtToFloat(2000), bahtToFloat(4000));
    this.office = office;
    this.officeRadius = officeRadius;
  }
  
  
  setupOffer(ls, emps){ this.offer = new Offer( null, "", ["passport"], "", "" ); }
  
  
  makeOffer(ms){

  }
  
  
  walk(){ this.loc = this.randomWalk( this.loc, this.stepSize, this.office.loc, this.officeRadius ); } 
  
  
  randomWalk( loc, mag, office, bounds ){    
    // NW N NE
    // W  *  E
    // SW S SE 
    let possibleSteps = [ createVector(-1, 1), createVector(0, 1), createVector(1, 1), createVector(-1, 0), createVector(1, 0), createVector(-1, -1), createVector(0, -1), createVector(1, -1) ];
    let proposedStep;                                                                                                      
    let stepIsValid = false; 
    while (!stepIsValid) {                                                                                                 
      proposedStep = p5.Vector.mult( random(possibleSteps), mag ).add( loc );                                                       
      let distance = proposedStep.dist(office);
      if(distance < 70 && distance > 20) stepIsValid = true;
    }
    return proposedStep;
  }
  
  
  // --- Class methods ------------------------
  
  static setupPopulation( ims, cdisMDB, esa, cdos){
    let officeRadius = 50;
    for (const [k, v] of Object.entries( cdisMDB )) {    
      let home = esa[k];
      let o = cdos[1].subarea == k ? cdos[1] : cdos[2];
      let office = { "subarea":k, "loc":o.loc };
      for(let i=0; i< v; i++){
        let id = `i${ims.length}`;
        let r = [1,-1];
        let loc =  createVector( 
          office.loc.x + ( random( officeRadius*0.25, officeRadius*0.7 ) * random(r) ), 
          office.loc.y + ( random( officeRadius*0.25, officeRadius*0.7 ) * random(r) ) 
        );
        ims.push( new MyanmarDocumentBroker( id, loc, k, office, officeRadius, 7 ) );
      }
    }
  }
  
}
