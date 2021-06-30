// -------------------------------------------------------------------
class Recruiter extends Intermediary{
  constructor( id, loc, home, diameter){
    super( id, loc, home, diameter, color("#8c4e95") );
    this.stepSize = 1;
    this.vision = 10;
    // SCENARIO 2
    this.fees = scenario == 2 ? 0 : random( bahtToFloat(5000), bahtToFloat(30000));
    this.passengerCurrent = 0;
    this.passengerMinimum = floor(random(20,41)); //20-40
  }
  
  
  setupOffer(ls, emps){    

  }
  
  
  //  30. Recuiter unsolicited offer rule
  makeOffer(ms){
    for (const [k, v] of Object.entries( ms )) {
      if( v.state == "premigration" && this.loc.dist( v.loc ) < this.vision && random(1) <= 0.7 ){
        push();
        strokeWeight(10);
        stroke("#8c4e9590");
        line( this.loc.x, this.loc.y, v.loc.x, v.loc.y );
        pop();
        
        v.history[frameCount].offerLeads.intermediaries.push( this.id );
        
        if( v.planningNetwork.filter( d => d == this.id ).length == 0 ){
          v.planningNetwork.push( this.id );
        }        
      }
      
    }
  }
  
  
  draw( ims, emps ){
    if(agencyLinksBool){
      push();
      stroke("#8c4e95");
      line( this.loc.x, this.loc.y, environment.agencies[this.agency].loc.x, environment.agencies[this.agency].loc.y );
      pop();
    }
    super.draw( ims, emps );
  }
  
  
  // --- Class methods ------------------------
  
  static setupPopulation(ims, cdisR, esa){
    for (const [k, v] of Object.entries( cdisR )) {
      let home = esa[k];
      for(let i=0; i< v; i++){
        let id = `i${ims.length}`;           
        let loc =  createVector( 
          random( home.boundaries[0].x +25, home.boundaries[1].x -25), 
          random( home.boundaries[0].y +25, home.boundaries[1].y -25) 
        );
        ims.push( new Recruiter( id, loc, k, 7 ) );
      }
    }
  }
  
}
