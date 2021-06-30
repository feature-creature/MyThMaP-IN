// -------------------------------------------------------------------
class Facilitator extends Intermediary{
  constructor( id, loc, home, diameter){
    super( id, loc, home, diameter, color("#fe5f58") );
    this.stepSize = 3;
    this.vision = 10;
    this.fees = random( bahtToFloat(2000), bahtToFloat(15000));
  }
  
  
  setupOffer(ls, emps){
    let rEmp = { "id": null, "home": random([ "Bangkok", "Phang Nga", "Tak", "Mae Sot" ]) };
    if( ls.employers.length > 0 ) rEmp = emps[ ls.employers[ floor(random(ls.employers.length)) ] ];
    this.offer = new Offer( rEmp.id, rEmp.home, [], "", "" );
  }
  
  
  //  30. Facilitator unsolicited offer rule
  makeOffer(ms){
    for (const [k, v] of Object.entries( ms )) {
      
      if( v.state == "premigration" && this.loc.dist( v.loc ) < this.vision && random(1) <= 0.7 ){
       
        push();
        strokeWeight(10);
        stroke("#fe5f5890");
        line( this.loc.x, this.loc.y, v.loc.x, v.loc.y );
        pop();
        
        v.history[frameCount].offerLeads.intermediaries.push(this.id);
        
        if( v.planningNetwork.filter( d => d == this.id ).length == 0 ){
          v.planningNetwork.push( this.id );
        }
        
      }
      
    }
  }
  
  
  // --- Class methods ------------------------
  
  static setupPopulation(ims, cdisF, esa){
    for (const [k, v] of Object.entries( cdisF )) {
      let home = esa[k];
      for(let i=0; i< v; i++){
        let id = `i${ims.length}`;
        let loc =  createVector( 
          random( home.boundaries[0].x +25, home.boundaries[1].x -25), 
          random( home.boundaries[0].y +25, home.boundaries[1].y -25) 
        );
        ims.push( new Facilitator( id, loc, k, 7 ) );
      }
    }
  }  
  
}
