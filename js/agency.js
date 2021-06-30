// -------------------------------------------------------------------
class Agency{
  constructor( id, subarea, loc ){ 
    this.id = id;
    this.subarea = subarea;
    this.loc = loc;
    this.recruiters = [];
    this.employers = [];
    this.offers = [];
    this.recruitMinimum = 5;    
  }  
  
  
  setupEmployerRoster(emps){
    let r = floor(random(4,7));
    for(let i=0; i<r; i++){
      let emp;                                                                
      let empIsValid = false; 
      // TODO: CANNOT DOUBLE LINK TO THE SAME EMPLOYER
      while (!empIsValid) {                                                                                                 
        emp = random(emps);
        if( emp.requiredDocuments == "work permit" ) empIsValid = true;
      }
      this.employers.push(emp.id);      
    }
    this.setupOffers(this.employers);
  }
  
  
  setupOffers(emps){
    // leaky function
    for(var i=0; i<emps.length; i++){
      this.offers.push( new Offer( emps[i], employers[emps[i].substring(1)].home, ["passport","work permit"], "", "official" ) );
    }
  }
  
  
  // --- Class methods ------------------------
  
  static setupEmployerRosters( as, imsr, emps ){
    this.setupRecruiterRosters(imsr, as);
    for( const [k, v] of Object.entries( as ) ) v.setupEmployerRoster(emps); 
  }
  
  
  static setupRecruiterRosters(imsR, eas){
    let as = eas;
    for(let i=0; i< imsR.length; i++){
      let agencyRecruiters = {};            
      for (const [k, v] of Object.entries( as )) {
        let yangonRecruiters = 0;
        let myawaddyRecruiters = 0;
        for(let r=0; r<v.recruiters.length; r++){
          if(intermediaries[ v.recruiters[r].substring(1) ].home == "Yangon") yangonRecruiters++;
          if(intermediaries[ v.recruiters[r].substring(1) ].home == "Myawaddy") myawaddyRecruiters++;
        } 
        agencyRecruiters[k] = {"Yangon":yangonRecruiters, "Myawaddy":myawaddyRecruiters};
      }
      
      for (const [k, v] of Object.entries( agencyRecruiters )) {
        if(v.Yangon == 0 && imsR[i].home == "Yangong"){
          imsR[i].agency = k;
          as[k].recruiters.push(imsR[i].id);
          break;
        }else if(v.Mywaddy == 0 && imsR[i].home == "Myawaddy"){
          imsR[i].agency = k;
          as[k].recruiters.push(imsR[i].id);
          break;
        }
      }
      
      if(typeof imsR[i].agency == "undefined"){
        let randAgency = floor(random(Object.keys(as).length)) + 1;
        imsR[i].agency = randAgency;
        as[randAgency].recruiters.push(imsR[i].id);
      }
      
    }
  }
  
}