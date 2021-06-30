// -------------------------------------------------------------------
class Employer{
  constructor(id, loc, home, sector, diameter, vision){
    this.id = id;
    this.home = home;
    this.loc = loc;
    this.d = diameter;
    this.vision = vision;
    this.sector = sector;
    this.monthlyDeductionRate = random(0,0.5);
    this.overtimeHours = floor(random(0,321));
    this.overtimeHourlyWage = random( 0, bahtToFloat(400));
    this.monthlyWage = random( bahtToFloat(0), bahtToFloat(10000));
    this.maximumEmployees = configData.sectors[sector].maximumEmployees;  
    this.currentEmployees = 0;
    this.links = { "employers":[], "intermediaries":[] };
    
    let rd = configData.sectors[sector].requiredDocuments;
    for(let i=0; i < rd.length; i++){
      if(random(1) <= rd[i][0]){
        this.requiredDocuments = rd[i][1];
        break;
      }
    }   
  }
  
  
  draw(ims){
    
    if( EmployerThailandDocBrokerLinksBool ){
      push();
      strokeWeight( 1 );
      stroke( 0, 60 );
      beginShape( LINES );
      for( let i=0; i < this.links.intermediaries.length; i++ ){
        let l = ims[ this.links.intermediaries[i] ].loc;
        vertex( this.loc.x, this.loc.y ); 
        vertex( l.x, l.y ); 
      }
      endShape();
      pop(); 
    }
    
    push();
    translate( this.loc.x, this.loc.y );
    stroke( 0,0,255 );
    fill( 0,0,255 );
    textAlign( CENTER, CENTER );
    textSize( 12 );
    text( this.sector[0].toUpperCase(), 0, 0 );
    noFill();
    circle( 0, 0, this.vision );
    pop();
  }

  
  randomNormalizedBool(percent){ return random(1) < percent ? true : false}
  
  
  // --- Class methods ------------------------
  
  static setupPopulation(emps, cdes, esa){
    let d = 5;
    let vision = d*5;
    for( const [k, v] of Object.entries( cdes ) ){
      for( const [l, n] of Object.entries( v ) ){
        let homeBoundaries = esa[l].boundaries;
        for( let i=0; i< n; i++ ){
          let id = `e${emps.length}`;
          let loc;
          let validLoc = false;
          while(!validLoc){
            loc =  createVector( 
              random( homeBoundaries[0].x + vision, homeBoundaries[1].x - vision), 
              random( homeBoundaries[0].y + vision, homeBoundaries[1].y - vision) 
            );
            validLoc = true;
            for( let j=0; j<emps.length; j++ ){
              if( loc.dist( emps[j].loc ) <= vision + 5){
                validLoc = false;
                break;
              }
            }
          }
          emps.push( new Employer( id, loc, l, k, d, vision ) );
        }
      }
    }
  }


  static setupIntermediaryLinks( emps, ims, cdls ){
    for( let i=0; i<emps.length; i++ ){
      for( const [k, v] of Object.entries( cdls ) ){
        if( random(1) < v && emps[i].home != "Tak"){  
          let linkMatch = false;
          while(!linkMatch){
            let r = floor( random(ims.length) );
            if( ims[r].constructor.name == k && ims[r].home == emps[i].home ){
              emps[i].links.intermediaries.push( r );
              linkMatch = true;
            }
          }
        } 
      }
    }
  }


  static drawPopulation(emps, ims){ for( let i=0; i<emps.length; i++ ) emps[i].draw(ims); }

}
