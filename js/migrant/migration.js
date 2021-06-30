// -------------------------------------------------------------------
class Migration{
  constructor( o, fc ){    
    let oIds   = o[0];
    let offer = o[1];

    this.init = fc;
    this.plan = new Plan(offer); 
    this.pathway = null; // identified on init
    this.precarity = 0;
    this.history = {};
    this.requestHelpTime = fc;
    this.leaveDecision = frameCount;
    this.duration = { "planning":0, "transit":0, "employed":0, "requestHelp":0 };


    this.currentEmployer = "";
    this.destination = "";
    this.documentation = [];
    this.transport = "";
    this.borderCrossing = "";

    this.migrationNetwork = oIds;
    // this.logOffer();
    
    this.cost = 0;

    this.lostDocumentation = false; 
    this.documentGetInit = 0;
    this.documentGetDuration = 0;
    this.destinationInit = 0;

    this.destinationLocation = null;
    this.myawaddyLocation = null;
    this.startEmployed = null;
    this.leaveSmuggler = null;
    this.leaveAgency = false;
    this.inMyawaddy = false;
    this.completed = false;

  }
  
  logOffer(){
    for( let i=0; i<this.migrationNetwork.length; i++ ){
      if( this.migrationNetwork[i][0] == "i"){
        outputData[ frameCount ].ao[ intermediaries[ this.migrationNetwork[i].substring(1) ].constructor.name ] += 1;    
      }
      if( this.migrationNetwork[i][0] == "m" && this.migrationNetwork[i] != this.id ){
        outputData[ frameCount ].ao[ "Family" ] += 1;    
        console.log(`${this.migrationNetwork[i]} vs ${this.id}`);
      } 
    }
  }
            
  
  hasDocument( t ){ return this.documentation.filter( d => d.type == t ).length > 0; }
  
  // TODO enhancement: sort/replace
  removeExpiredDocuments( ){
    for( let i=0; i<this.documentation.length; i++ ){
      if( this.documentation[i].isExpired() ){
        this.lostDocumentation = true;
        // console.log("removes " + this.documentation[i].type);
        this.documentation.splice( i, 1 );
        i=0;
      } 
    }
  }
  
}