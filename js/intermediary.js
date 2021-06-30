// -------------------------------------------------------------------
class Intermediary{
  constructor( id, loc, home, diameter, color){
    this.id = id;
    this.loc = loc;
    this.home = home; 
    this.d = diameter;
    this.color = color;
    this.stepSize = 3;
    // this.vision = diameter*2;
    this.vision = 10;
    
    this.fees = random( bahtToFloat(500), bahtToFloat(30000));
    this.links = { "intermediaries":[], "employers":[] }; 
  }
  
  setupOffer(ls, emps){    

  }
  
  
  makeOffer(ms){

  }
  
  
  walk(){ this.loc = this.randomWalk( this.loc, this.stepSize, environment.subareas[this.home].boundaries ); } 
  
  //  29a. Intermediary Random Walk Rule
  randomWalk(loc, mag, bs){    
    // NW N NE
    // W  *  E
    // SW S SE 
    let possibleSteps = [ createVector(-1, 1), createVector(0, 1), createVector(1, 1), createVector(-1, 0), createVector(1, 0), createVector(-1, -1), createVector(0, -1), createVector(1, -1) ];
    let proposedStep;                                                                                                      
    let stepIsValid = false; 
    //  29b. Intermediary Random Walk Constraint
    while (!stepIsValid) {                                                                                                 
      proposedStep = p5.Vector.mult( random(possibleSteps), mag ).add( loc );                                                       
      if( 
        bs[0].x < proposedStep.x && proposedStep.x < bs[1].x && 
        bs[0].y < proposedStep.y && proposedStep.y < bs[1].y 
      ) stepIsValid = true;
    }
    return proposedStep;
  }
  
  
  draw( ims, emps ){
    if(intermediaryIntermediaryLinksBool){
      push();
      strokeWeight(1);
      stroke(0,60);
      beginShape(LINES);
      for(let i=0; i < this.links.intermediaries.length; i++){
        let l = ims[ this.links.intermediaries[i] ].loc;
        vertex( this.loc.x, this.loc.y ); 
        vertex( l.x, l.y ); 
      }
      endShape();
      pop();   
    }
    
    if(intermediaryEmployerLinksBool){      
      push();
      strokeWeight(1);
      stroke(0,60);
      beginShape(LINES);
      for(let i=0; i < this.links.employers.length; i++){
        let l = emps[ this.links.employers[i] ].loc;
        vertex( this.loc.x, this.loc.y ); 
        vertex( l.x, l.y ); 
      }
      endShape();
      pop();   
    }
  
    push();
    translate(this.loc.x, this.loc.y);
    stroke(0);
    noFill();
    circle(0,0,this.vision*2);
    noStroke();
    fill(this.color);
    circle(0,0,this.d);
    pop();
  }
  
  
  // --- Class methods ------------------------
 
  static setupPopulation(ims, cdis, cde, cdos, cdas){
    Smuggler.setupPopulation( ims, cdis.smugglers, cde );
    MyanmarDocumentBroker.setupPopulation( ims, cdis.myanmarDocumentBrokers, cde, cdos );
    ThailandDocumentBroker.setupPopulation( ims, cdis.thailandDocumentBrokers, cde );
    Recruiter.setupPopulation( ims, cdis.recruiters, cde );
    Facilitator.setupPopulation( ims, cdis.facilitators, cde );
  }

  // facilitators match to smugglers that have the same destination
  static setupIntermediaryLinks( ims, cdls ){
    for(let i=0; i<ims.length; i++){
      let t = ims[i].constructor.name;
      let chances = cdls[t];
      for (const [k, v] of Object.entries( chances )) {
        if( random(1) < v ){  
          let linkMatch = false;
          while(!linkMatch){
            let r = floor(random(ims.length));
            if( r != i && ims[r].constructor.name == k ){
              ims[i].links.intermediaries.push(r);
              linkMatch = true;
            }
          }
        } 
      }
    }
  }
  
  
  static setupEmployerLinks( ims, emps, cdls ){
    for(let i=0; i<ims.length; i++){
      let t = ims[i].constructor.name;
      let chances = cdls[t];
      if( random(1) < chances ){ 

        if(t == "Recruiter"){
          
          // TODO: parameterize agencies
          let agencyEmps = environment.agencies[ ims[i].agency ].employers;
          let emp = random(agencyEmps).substring(1);
          ims[i].links.employers.push( emp );  
          
        }else if(t == "Smuggler"){
          
          let emp;                                                                
          let empIsValid = false; 
          while (!empIsValid) {                                                                                                 
            emp = random(emps);
            if( emp.home == ims[i].offer.destination ) empIsValid = true;
          }
          ims[i].links.employers.push( emp.id.substring(1) ); 
          
        }else{  // facilitator
          let r = floor(random(emps.length));
          ims[i].links.employers.push(r);          
        }
        
      }
    }
  }

  
  static setupOfferPopulation(ims, emps){
    for(let i=0; i< ims.length; i++){
      ims[i].setupOffer( ims[i].links, emps );    
    } 
  }  

  
  static movePopulation( ims ){ for(let i=0; i< ims.length; i++) ims[i].walk(); }
  
  static makeOfferPopulation( ims, ms ){ for(let i=0; i< ims.length; i++) ims[i].makeOffer( ms ); }
  
  static drawPopulation( ims, emps ){ for(let i=0; i< ims.length; i++) ims[i].draw( ims, emps ); }  
    
}