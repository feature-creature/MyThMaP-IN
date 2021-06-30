// -------------------------------------------------------------------
class Family{
  
  constructor( id, home ){
    this.id = id;
    this.home = home;
    this.members = [];
    this.history = {};
    this.extendedFamilies;
    this.financialShocks = 0;
  }
  
  setCurrentWealth(){
    let sum = 0;
    for(let m=0; m<this.members.length; m++) sum += migrants[this.members[m]].wealth;
    let avg = sum/this.members.length
    return {"avg" : avg, "sum":sum };
  }
  
  // --- Class methods ------------------------
  
  // 3a. Relative Average Nuclear Family Wealth Rule
  static calculateAverageWealth(fs, esas){
    let subAreaWealths = {};
    for(const [k, v] of Object.entries( esas )) {
      if(v.area == "origin") subAreaWealths[k] = [];
    }

    for(const [k, v] of Object.entries( fs )) {
      let currentWealth = v.setCurrentWealth();
      v.history[frameCount] = {"avg":currentWealth.avg, "sum":currentWealth.sum};
      subAreaWealths[v.home].push( [ k, currentWealth.sum ] );
    }
    
    for(const [k, v] of Object.entries( subAreaWealths )) {
      v.sort(function(a, b) {return a[1] - b[1];});
    }
    
    Family.relativeWealths = subAreaWealths;
  }
  
  
  static drawLinks(fs, ms){
    push();
    stroke(0,50);
    strokeWeight(1);
    beginShape(LINES);   
    for(const [k, v] of Object.entries( fs )) {
      if(v.members.length > 1){
        for(let i=0; i<=v.members.length; i++){
          for(let j=i; j<v.members.length; j++){
            vertex( ms[ v.members[i] ].loc.x, ms[ v.members[i] ].loc.y );
            vertex( ms[ v.members[j] ].loc.x, ms[ v.members[j] ].loc.y );
          }
        }          
      }
    }
    endShape();
    pop();
  }

  
  static setupExtendedFamilies(fs){
    let lf = {};
    let ef = {};
    
    // array of families sorted by home location
    for( const [k, v] of Object.entries( fs ) ) {
      if(typeof(lf[v.home]) == "undefined") lf[v.home] = [];
      lf[v.home].push(v.id);
    } 
    
    // array of families (in home location) for creating extended families     
    let lfKeys = Object.keys(lf)
    for(let i=0; i<lfKeys.length; i++){ ef[lfKeys[i]] = {}; }
    
    // chunk families into extended families
    for( const [k, v] of Object.entries( lf ) ) {
      v.sort(() => random() - 0.5);
      var i,j,ta,chunk;
      for (i=0,j=v.length; i<j; i+=chunk) {
        chunk = floor(random(3)) + 1;
        ta = v.slice(i,i+chunk);
        ef[k][i] = ta;
      }
    }

    // assign extended families to each family instance
    for( const [k, v] of Object.entries( ef ) ) {
      for( const [exf, f] of Object.entries( v ) ) {
        for(var i=0; i<f.length; i++){
          let exfs = f.filter(a => a !== f[i]);
          fs[ f[i] ].extendedFamilies = exfs;
        }
      }
    }
      
  }
  
  
  static relativeWealths;
    
}