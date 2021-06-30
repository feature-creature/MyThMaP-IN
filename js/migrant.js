// -------------------------------------------------------------------
class Migrant {
  constructor( id, family, loc, home, diameter ){
    this.id = id;
    this.family = family;
    this.loc = loc;
    this.home = home;
    this.stepSize = 2;
    this.d = diameter;
    this.vision = diameter * 1.5;
    this.color = color(0);
    this.motivation = random(0.35);
    this.motivationThreshold = random(0.7, 1);
    this.influence = random(0.75);
    this.influenceThreshold = 0.25;
    this.influenceIncreaseRate = 1.1;
    this.influenceDecreaseRate = 0.9;

    this.state = "premigration";
    this.planningNetwork = [];
    this.migrations = [];
    this.history = {};
    for(let i=1; i<=ticks; i++){
      this.history[i] = { 
        "offerLeads": { "migrants": [], "intermediaries": [] }, 
        "s": "", 
        "w": 0,
        "i": 0,
        "m": 0,
        "constraints": { 
          "wealth":     {"low":false,"high":false},
          "influence":  {"low":false,"high":false},
          "motivation": {"low":false,"high":false},
        } 
      };
    }


    this.preference = this.determinePreference( scenario );
    this.monthlyWealthFluctuationOffset = floor(random( 1, 31 )); // 1-30
    this.debt = { "family": 0, "industry": 0 };

    let homeType = environment.subareas[this.home].type;
    this.wealth = homeType == "rural" ? random( bahtToFloat(0), bahtToFloat(2000) ) : random( bahtToFloat(0), bahtToFloat(4000) );
  }
  
  
  updateWealth( ){
    if( this.state == "premigration" || this.state == "planning" ){
      this.wealthChangeShockAndFluctuation();
    }
  }


  walk( ){
    if( this.state == "premigration" ){
      // if( verify >= 1 || verify == null ) this.loc = this.randomWalk( this.loc, this.stepSize, environment.subareas[this.home].boundaries );
      this.loc = this.randomWalk( this.loc, this.stepSize, environment.subareas[this.home].boundaries );
    }else if( this.state == "planning" ){
      // if( verify >= 2 || verify == null ) this.planningWalk();
      this.planningWalk();
    }else if( this.state == "transit" ){
      // if( verify >= 3 || verify == null ) this.transitWalk();
      this.transitWalk();
    }else if( this.state == "employed" ){
      // if( verify >= 4 || verify == null ) this.loc = this.randomWalk( this.loc, this.stepSize * 3, environment.subareas[this.migrations[0].destination].boundaries );
      this.loc = this.randomWalk( this.loc, this.stepSize * 3, environment.subareas[this.migrations[0].destination].boundaries );
    }
  }


  update( ms, fs, frw, ias, ims, emps, ol, m, mt ){
    if( this.state == "premigration" ){
      // if(verify >= 1 || verify == null ) this.premigrationUpdate( ms, fs, frw, ias, ims, emps, ol, m, mt );
      this.premigrationUpdate( ms, fs, frw, ias, ims, emps, ol, m, mt );
    }else if( this.state == "planning" ){
      // if(verify >= 2 || verify == null ) this.planningUpdate( ms, fs, frw, ias, ims, emps, ol, m, mt );
      this.planningUpdate( ms, fs, frw, ias, ims, emps, ol, m, mt );
    }else if( this.state == "transit" ){
      // if(verify >= 3 || verify == null ) this.transitUpdate();
      this.transitUpdate();
    }else if( this.state == "employed" ){
      // if(verify >= 4 || verify == null ) this.employedUpdate();
      this.employedUpdate();
    }
  }


  //  Rule 0. determine migration preference
  determinePreference( sc=0 ){
    let sum = 0;
    let r = random(1);
    let preferenceDistribution = {
      "0": [ 
        [0.05, "fees"], 
        [0.05, "proximity"], 
        [0.05, "legal"], 
        [0.10, "wage"], 
        [0.15, "sector"], 
        [0.15, "work"], 
        [0.15, "social"], 
        [0.15, "family"], 
        [0.15, "intermediary"]
      ],
      "1": [ 
        [0.25, "fees"],         
        [0.25, "legal"],         
        [0.25, "family"], 
        [0.25, "intermediary"] 
      ],
      "2": [ 
        [0.20, "social"], 
        [0.20, "work"], 
        [0.20, "sector"], 
        [0.20, "wage"], 
        [0.20, "proximity"]
      ]
    }
       
    // ad
    for( let i=0; i<preferenceDistribution[ sc ].length; i++ ){
      sum += preferenceDistribution[ sc ][ i ][ 0 ];
      if( r < sum ) return preferenceDistribution[ sc ][ i ][ 1 ];
    }
  }


  // ---------------------------------------
  // ---------------------------------------
  // ---------------------------------------
  // PREMIGRATION STATE
  // ---------------------------------------
  // ---------------------------------------
  // ---------------------------------------


  //  Rule 1-7
  premigrationUpdate( ms, fs, frw, ias, ims, emps, ol, m, mt ){
    //  Rule 4
    this.motivation = this.wealthInfluenceRule( this.motivation, frw );
    this.motivation = this.socialInfluenceRule( this.motivation, ms, fs, ias );    
    if( this.motivation < 0) this.history[ frameCount ].constraints.motivation.low = true;
    if( this.motivation > 1) this.history[ frameCount ].constraints.motivation.high = true;
    this.motivation = constrain( this.motivation, 0, 1 );

    //  Rule 5 & 6
    this.unsolicitedOffers( ms, ims, emps, ias );

    //  Rule 7 Migration Motivation Decision
    if( this.state == "premigration" && this.motivation > this.motivationThreshold ){
      let o = [ [this.id], new Offer( null, "", [], "", "" ) ];
      this.startMigration( o, frameCount, this.migrations );
    }
  }


  //  Rule 1. Migrant Random Walk + Constraint
  randomWalk( loc, mag, bs ){
    let possibleSteps = [createVector(-1, 1), createVector(0, 1), createVector(1, 1), createVector(-1, 0), createVector(1, 0), createVector(-1, -1), createVector(0, -1), createVector(1, -1)];
    let proposedStep;
    let stepIsValid = false;
    while( !stepIsValid ){
      proposedStep = p5.Vector.mult(random(possibleSteps), mag).add(loc);
      if( bs[0].x < proposedStep.x && proposedStep.x < bs[1].x && bs[0].y < proposedStep.y && proposedStep.y < bs[1].y ) stepIsValid = true;
    }
    return proposedStep;
  }


  //  Rule 2a. Financial Shock 
  financialShock( wc ){
    let fs = this.randomNormalizedBool(0.0001) ? 0.7 : wc;
    if( fs == 0.7 ) families[ this.family ].financialShocks += 1;
    return fs;
  }


  //  Rule 2b. Wealth Fluctuation
  monthlyWealthFluctuation( wc, mwf ){
    let mwc = wc
    if( (frameCount - mwf) % 30 == 0 ) mwc += random(-0.05, 0.05);
    return mwc;
  }

  
  //  Rule 2c-d. Wealth Change + Constraint
  wealthChangeShockAndFluctuation( ){
    let wealthChange = 1;
    wealthChange = this.financialShock( wealthChange );
    wealthChange = this.monthlyWealthFluctuation( wealthChange, this.monthlyWealthFluctuationOffset );
    if( this.wealth * wealthChange < 0) this.history[ frameCount ].constraints.wealth.low = true;
    if( this.wealth * wealthChange > 1) this.history[ frameCount ].constraints.wealth.high = true;
    this.wealth = constrain( this.wealth * wealthChange, 0, 1 );
  }
  

  //  Rule 3a. Relative Average Nuclear Family Wealth (located in Family class) 
  //  Rule 3b. Wealth And Motivation
  //  Rule 3c. Motivation Constraint (located in premigrationUpdate method)
  wealthInfluenceRule( mot, frw ){
    let rw;
    let motivation = mot;
    for( let i = 0; i < frw.length; i++ ){
      if( this.family == frw[i][0] ){
        rw = i / frw.length;
        break;
      }
    }
    // 0 == poorest, 1 == wealthiest
    if( rw >= 0.4 && rw <= 0.6 && this.motivationThreshold <= 0.8 ){
      motivation += 0.01;
    }else if( rw > 0.8){
      motivation -= 0.01;
    }
    return motivation;
  }


  //  Rule 4a. Weighted Average Influence
  //  Rule 4b. Influence and Motivation
  socialInfluenceRule( mot, ms, fs, ias ){
    let motivation = mot;
    let socialInfluence = { "sum": 0, "count": 0, "avg": 0 };
    for( const [k, v] of Object.entries(fs) ){
      if( v.home == this.home ){
        // extended family migrants
        if( this.family == v.id || fs[this.family].extendedFamilies.includes(v.id) ){
          for( let i = 0; i < v.members.length; i++ ){
            socialInfluence.sum += (ms[v.members[i]].influence * 2);
            socialInfluence.count += 2;
          }
        }else{ 
        // visible (non-family) migrants
          for( let i = 0; i < v.members.length; i++ ){
            if( p5.Vector.dist(this.loc, ms[v.members[i]].loc) < this.vision ){
              let m = ms[v.members[i]];
              let weight = m.migrations.filter( d => d.completed ).length > 0 ? 2 : 1;
              socialInfluence.sum += (m.influence * weight);
              socialInfluence.count += weight;
              if( ias[frameCount].filter( d => ( d.source == v.members[i] && d.target == this.id ) || ( d.target == v.members[i] && d.source == this.id ) ).length == 0 ){
                ias[frameCount].push( {"source":this.id, "target":v.members[i]} );
              }
            }
          }
        }
      }
    }
    socialInfluence.avg = socialInfluence.sum / socialInfluence.count;

    if( socialInfluence.avg > motivation + this.influenceThreshold && random(1) < 0.5 ){
      motivation += 0.001;
    }else if( socialInfluence.avg < motivation - this.influenceThreshold && random(1) < 0.5 ){
      motivation -= 0.001;
    }
    return motivation;
  }


  //  Rule 5a. Premigration Migrant Receive Unsolicited Offers
  //  Rule 5b. Review Unsolicited Migrant Offers
  //  Rule 5c. Review Unsolicited Intermediary Offers
  //  Rule 6.  Unsolicited Offer Decision
  unsolicitedOffers( ms, ims, emps ){
    let offerLeads = this.history[frameCount].offerLeads;
    let currentOffers = [];
    let currentOffersPreferred = [];
    let currentOffersNonPreferred = [];

    if( offerLeads.migrants.length > 0 && this.motivation > this.motivationThreshold - 0.10 ){
      currentOffers = this.unsolicitedMigrantOffers( offerLeads.migrants, ms, ims, emps );
      //-- same
      currentOffers = this.addPreferenceData( currentOffers, ms );
      for( let i = 0; i < currentOffers.length; i++ ){
        if( this.preferenceMatch( this.preference, currentOffers[i][1], currentOffers[i][0] ) ){
          currentOffersPreferred.push( currentOffers[i] );
        }else{
          currentOffersNonPreferred.push( currentOffers[i] );
        }
      }
    }
    if( currentOffers.length == 0 && offerLeads.intermediaries.length > 0 && this.motivation > this.motivationThreshold - 0.05 ){
      currentOffers = this.unsolicitedIntermediaryOffers( offerLeads.intermediaries, ims, emps );
      //-- same
      currentOffers = this.addPreferenceData( currentOffers, ms );
      for( let i = 0; i < currentOffers.length; i++ ){
        if( this.preferenceMatch( this.preference, currentOffers[i][1], currentOffers[i][0] ) ){
          currentOffersPreferred.push( currentOffers[i] );
        }else{
          currentOffersNonPreferred.push( currentOffers[i] );
        }
      }
    }

    if( random(1) < 0.9 ){
      if( currentOffersPreferred.length > 0 ){
        let ro = random( currentOffersPreferred );
        this.startMigration( ro , frameCount, this.migrations );  
      }else if( currentOffersNonPreferred.length > 0 ){
        let o = random( currentOffersNonPreferred );
        let p = o[0][0][0] == "m" ? 0.4 : 0.2; // family vs intermediary
        if( random(1) < p ) this.startMigration( o, frameCount, this.migrations);
      }
    }
  }


  //  Rule 5b. Review Unsolicited Migrant Offers
  unsolicitedMigrantOffers( pnMigrants, ms, ims, emps ){
    let currentOffers = [];

    for( let i=0; i<pnMigrants.length; i++ ){
      let m = ms[ pnMigrants[i] ];
      if( this.id != m.id ){
        if( m.state == "employed" ){
          let mm = m.migrations[0];
          let mmmni = mm.migrationNetwork.filter(p => p[0] == "i");

          let baseOffer = new Offer( mm.currentEmployer, mm.destination, [], "", "" );
          currentOffers.push( [ [m.id], baseOffer ] );

          for( let j=0; j<mmmni.length; j++ ){     
            let im = ims[ mmmni[j].substring(1) ];

            // MyanmarDocumentBroker
            if( im.constructor.name == "MyanmarDocumentBroker" ){
              let myanmarDocumentBrokerOffer = new Offer( baseOffer.employer, baseOffer.destination, ["passport"], "", "" );
              currentOffers.push( [ [m.id, im.id], myanmarDocumentBrokerOffer ] );
            }

            // Smuggler
            if( im.constructor.name == "Smuggler" ){
              let smugglerOffer = new Offer( baseOffer.employer, baseOffer.destination, ["none"], im.id, "unofficial2" );
              currentOffers.push( [ [m.id, im.id], smugglerOffer ] );
            }

            // Recruiter
            if( im.constructor.name == "Recruiter" ){
              let agencyOffers = environment.agencies[im.agency].offers;
              let matchingOffers = [];
              let nonmatchingOffers = [];
              for( let k = 0; k < agencyOffers.length; k++ ){
                let recruiterOffer = new Offer( agencyOffers[k].employer, agencyOffers[k].destination, agencyOffers[k].documentation, im.id, agencyOffers[k].borderCrossing );
                if( baseOffer.destination == recruiterOffer.destination ){
                  if( this.preferenceMatch( this.preference, recruiterOffer, [m.id, im.id] ) ){
                    matchingOffers.push(recruiterOffer);
                  }else{
                    nonmatchingOffers.push(recruiterOffer);
                  }
                }
              }

              if( matchingOffers.length > 0 ){
                currentOffers.push([ [m.id, im.id], random(matchingOffers) ]);
              }else if( nonmatchingOffers.length > 0 ){
                currentOffers.push([ [m.id, im.id], random(nonmatchingOffers) ]);
              }
            }
          }
        }
      }
    }
    return currentOffers;
  }
  

  //  Rule 5c. Review Unsolicited Intermediary Offers
  unsolicitedIntermediaryOffers( pnIntermediaries, ims, emps ){
    let currentOffers = [];
    
    for( let i = 0; i < pnIntermediaries.length; i++ ){
      let im = ims[ pnIntermediaries[i].substring(1) ];

      // Recruiter
      if( im.constructor.name == "Recruiter" ){
        let agencyOffers = environment.agencies[im.agency].offers;
        let matchingOffers = [];
        let nonmatchingOffers = [];
        for( let j = 0; j < agencyOffers.length; j++ ){
          let recruiterOffer = new Offer( agencyOffers[j].employer, agencyOffers[j].destination, agencyOffers[j].documentation, im.id, agencyOffers[j].borderCrossing );
          if( this.preferenceMatch( this.preference, recruiterOffer, [im.id] ) ){
            matchingOffers.push( recruiterOffer );
          }else{
            nonmatchingOffers.push( recruiterOffer );
          }
        }
        
        if( matchingOffers.length > 0 ){
          currentOffers.push([ [im.id], random(matchingOffers) ]);
        }else if( nonmatchingOffers.length > 0 ){
          currentOffers.push([ [im.id], random(nonmatchingOffers) ]);
        }          
      }

      // Facilitator
      if( im.constructor.name == "Facilitator" ){
        let baseOffer = new Offer( im.offer.employer, im.offer.destination, im.offer.documentation, im.offer.transport, im.offer.borderCrossing );
        currentOffers.push([ [im.id], baseOffer ]);

        for( let l = 0; l < im.links.intermediaries.length; l++ ){
          let cim = ims[ im.links.intermediaries[l] ];

          // Facilitator + Recruiter
          if( cim.constructor.name == "Recruiter" ){
            let agencyOffers = environment.agencies[cim.agency].offers;
            let matchingOffers = [];
            let nonmatchingOffers = [];
            for( let j = 0; j < agencyOffers.length; j++ ){
              let recruiterOffer = new Offer( agencyOffers[j].employer, agencyOffers[j].destination, agencyOffers[j].documentation, cim.id, agencyOffers[j].borderCrossing );
              if( this.preferenceMatch( this.preference, recruiterOffer, [im.id, cim.id] ) ){
                matchingOffers.push(recruiterOffer);
              }else{
                nonmatchingOffers.push(recruiterOffer);
              }
            }

            if(matchingOffers.length > 0){
              currentOffers.push([ [im.id, cim.id], random(matchingOffers) ]);
            }else if( nonmatchingOffers.length > 0 ){
              currentOffers.push([ [im.id, cim.id], random(nonmatchingOffers) ]);
            }
          }

          // Facilitator + Smuggler
          if( cim.constructor.name == "Smuggler" ){
            let smugglerOffer = new Offer( baseOffer.employer, baseOffer.destination, cim.offer.documentation, cim.offer.transport, cim.offer.borderCrossing );
            currentOffers.push( [ [im.id, cim.id], smugglerOffer ] );
          }
        }
      }
    }
    return currentOffers;
  }


  //  Rule 5. Preference helper method 1
  addPreferenceData( cos, ms ){
    let currentOffers = cos;

    for( let i = 0; i < currentOffers.length; i++ ){
      // fees, wages, sector
      let fees = 0;
      for( let j = 0; j < currentOffers[i][0].length; j++ ){
        fees += currentOffers[i][0][j][0] == "i" ? intermediaries[ currentOffers[i][0][j].substring(1) ].fees : 0;
      } 
      currentOffers[i][1].fees = fees;
      currentOffers[i][1].monthlyWage = currentOffers[i][1].employer == null ? 0 : employers[ currentOffers[i][1].employer.substring(1) ].monthlyWage;
      currentOffers[i][1].sector = currentOffers[i][1].employer == null ? "" : employers[ currentOffers[i][1].employer.substring(1) ].sector;

      // family
      let familyCount = 0;
      for( const [k, v] of Object.entries(ms) ){
        if( v.state == "employed" && v.family == this.family && v.migrations[0].destination == currentOffers[i][1].destination ) familyCount++;
      }
      currentOffers[i][1].family = familyCount;
      
      // social
      let socialCount = 0;
      for( const [k, v] of Object.entries(ms) ){
        if( v.state == "employed" && v.migrations[0].destination == currentOffers[i][1].destination ) socialCount++;
      }
      currentOffers[i][1].social = socialCount;

      // proximity
      let destinationCenter = createVector(width,height*0.5);
      if( currentOffers[i][1].destination != "" ){
        destinationCenter = environment.subareas[currentOffers[i][1].destination].boundaries[0].copy().sub( environment.subareas[currentOffers[i][1].destination].boundaries[1] );
      }
      let homeCenter = environment.subareas[this.home].boundaries[0].copy().sub( environment.subareas[this.home].boundaries[1] );
      currentOffers[i][1].proximity = p5.Vector.dist( homeCenter, destinationCenter );
    }

    // fees ranking
    currentOffers.sort( function(a, b) { return a[1].fees - b[1].fees; } );
    for( let i = 0; i < currentOffers.length; i++ ) currentOffers[i][1].feesRank = i;
    
    // wages ranking
    currentOffers.sort( function(a, b) { return b[1].monthlyWage - a[1].monthlyWage; } );
    for( let i = 0; i < currentOffers.length; i++ ) currentOffers[i][1].wagesRank = i;
    
    // social ranking
    currentOffers.sort( function(a, b) { return b[1].social - a[1].social; } );
    for( let i = 0; i < currentOffers.length; i++ ) currentOffers[i][1].socialRank = i;

    // proximity ranking
    currentOffers.sort( function(a, b) { return a[1].proximity - b[1].proximity } );
    for( let i = 0; i < currentOffers.length; i++) currentOffers[i][1].proximityRank = i;
    return currentOffers;
  }


  //  Rule 5. Preference helper method 2
  preferenceMatch( p, o, a ){
    // debugger;
    let match = false
    if( p == "intermediary" ){
      match = a != null && a.filter( ag => ag[0] == "i").length > 0;
    }else if( p == "legal" ){
      match = o.documentation.includes("work permit") || o.documentation.includes("passport");    
    }else if( p == "work" ){
      match = o.employer != null;
    }else if( p == "sector" ){
      match =  (o.sector == "manufacturing" || o.sector == "services");    
    }else if( p == "wage" ){
      match = (o.monthlyWage >= 0.09);      
    }else if( p == "fees" ){
      match = (o.feesRank == 0);    
    }else if(p == "proximity"){
      match = (o.proximityRank == 0);    
    }else if( p == "social"){
      match = (o.socialRank == 0);      
    }else if( p == "family") {
      match = (o.family > 0);    
    }
    return match;
  }


  //  Rule 6. Offer decision helper method 1
  startMigration( o, fc, migs ){
    migs.unshift(new Migration( o, fc ) );
    
    //
    for( let i=0; i<this.migrations[0].migrationNetwork.length; i++ ){
      if( this.migrations[0].migrationNetwork[i][0] == "i"){
        outputData[ frameCount ].ao[ intermediaries[ this.migrations[0].migrationNetwork[i].substring(1) ].constructor.name ] += 1;    
      }
      if( this.migrations[0].migrationNetwork[i][0] == "m" && this.migrations[0].migrationNetwork[i] != this.id ){
        outputData[ frameCount ].ao[ "Family" ] += 1;    
      } 
    }
    
    
    this.state = "planning";
    let smugs = migs[0].migrationNetwork.filter( i => i[0] == "i" && intermediaries[ i.substring(1) ].constructor.name == "Smuggler");
    if( smugs.length > 0 ){
      migs[0].leaveSmuggler = false;      
      intermediaries[ smugs[0].substring(1) ].passengerCurrent.push(this.id);
    }
    //  6b. Influence Constaint 
    if( this.influence * this.influenceIncreaseRate < 0) this.history[ frameCount ].constraints.influence.low  = true;
    if( this.influence * this.influenceIncreaseRate > 1) this.history[ frameCount ].constraints.influence.high = true;
    this.influence = constrain(this.influence * this.influenceIncreaseRate, 0, 1);
  }


  // ---------------------------------------
  // ---------------------------------------
  // ---------------------------------------
  // PLANNING STATE
  // ---------------------------------------
  // ---------------------------------------
  // ---------------------------------------


  //  Rule 8-15
  planningUpdate( ms, fs, frw, ias, ims, emps, ol, m, mt ){
    let cm = this.migrations[0]; 
    // submodel 2A
    if( cm.migrationNetwork.length == 1 && cm.migrationNetwork[0] == this.id && cm.plan.destination == "" ){
      if( cm.duration.planning < 30  ){
        //  Rule 9-11.
        this.solicitedOffers( ms, ims, emps, ias, fs );
      }else{
        //  Rule 12.
        this.determineDestination(this.preference, ms);
      }
    }else if(cm.migrationNetwork.length > 1 && ( cm.plan.destination == "" || typeof cm.plan.destination == "undefined" || cm.plan.destination == "undefined" ) ){
      //  Rule 12.
      this.determineDestination(this.preference, ms);
    }else{
      // submodel 2B
      if( typeof cm.documentationLocation == "undefined" ){
        if( cm.plan.documentation.length == 0 ){ // no docs
          //  Rule 13a
          this.preTransitDocumentDecision(this.preference, ms, ims, emps, ias, fs);
        } 
        //  Rule 13b
        this.determineDocumentationLocation(ims);
      }
      //  Rule 14-15
      this.getPreTransitDocuments(ims);
    }

    this.migrations[0].duration.planning += 1;
    this.migrations[0].removeExpiredDocuments();
  }


  //  Rule 8. planning walk
  planningWalk( ){
    if( this.migrations[0].migrationNetwork == this.id && this.migrations[0].plan.destination == "" ){
      this.loc = this.randomWalk( this.loc, this.stepSize, environment.subareas[this.home].boundaries );
    }
  }

 
  //  Rule 9. solicited offers
  solicitedOffers( ms, ims, emps, ias, fs ){
    let currentOffers = [];
  
    let planningNetworkMigrants = this.planningNetwork.filter( member => member[0] == "m" ); 
    if( planningNetworkMigrants.length > 0 ){
      currentOffers = this.solicitedMigrantOffers( planningNetworkMigrants, ms, ims, emps );
    }

    if( currentOffers.length == 0 ) {
      let planningNetworkIntermediaries = this.planningNetwork.filter( member => member[0] == "i" );
      if( planningNetworkIntermediaries.length > 0 ) {
        currentOffers = this.solicitedIntermediaryOffers( planningNetworkIntermediaries, ims, emps );
      }
    }
      
    //  Rule 9c. review solicited offers rule
    currentOffers = this.addPreferenceData( currentOffers, ms );
    let bestOffer = this.solicitedOffersSort( currentOffers );

    //  Rule 10. Accept best solicited Offer decision
    //  Rule 11. Seek contacts
    if( bestOffer == null ){
      this.seekContacts(ms, ims, ias, fs);
    }else{
      this.migrations[0].plan = new Plan( bestOffer[1] );
      for( let i=0; i<bestOffer[0].length; i++ ){
        if( this.migrations[0].migrationNetwork.filter( d => d == bestOffer[0][i] ).length == 0 ){
          this.migrations[0].migrationNetwork.push( bestOffer[0][i] );
          if( bestOffer[0][i][0] == "i"){
            outputData[ frameCount ].ao[ intermediaries[ bestOffer[0][i].substring(1) ].constructor.name ] += 1;    
          }
          if( bestOffer[0][i][0] == "m" && bestOffer[0][i] != this.id ){
            outputData[ frameCount ].ao[ "Family" ] += 1;         
          }          
          if( bestOffer[0][i][0] == "i" && intermediaries[ bestOffer[0][i].substring(1) ].constructor.name == "Smuggler" ){
            this.migrations[0].leaveSmuggler = false;      
            intermediaries[ bestOffer[0][i].substring(1) ].passengerCurrent.push(this.id);
          }
        }
      }
    }

  }


  //  Rule 9. solicited migrant offers helper method
  solicitedMigrantOffers( pnMigrants, ms, ims, emps ){
    let currentOffers = [];

    for( let i=0; i<pnMigrants.length; i++ ){
      let m = ms[ pnMigrants[i] ];
      if( this.id != m.id ){
        let mm = null;
        if( m.state == "employed" ){
          mm = m.migrations[0];
        } else {
          for( let j=0; j<m.migrations.length; j++ ){
            if( m.migrations[j].completed == true ){
              mm = m.migrations[j];
              break;
            }
          }
        }
        if( mm != null ){

          let vac = employers[ mm.currentEmployer.substring(1) ].maximumEmployees > employers[ mm.currentEmployer.substring(1) ].currentEmployees;
          let emp = vac ? mm.currentEmployer : null;
          let baseOffer = new Offer( emp, mm.destination, [], "", "" );
          currentOffers.push( [ [m.id], baseOffer ] );

          // -------------------
          // COMBINATION OFFERS
          // -------------------
          let mmmni = mm.migrationNetwork.filter(p => p[0] == "i" && ims[ p.substring(1)].constructor.name != "ThailandDocumentBroker" && ims[ p.substring(1)].constructor.name != "Facilitator" );
          for( let j=0; j<mmmni.length; j++ ){
            let im = ims[ mmmni[j].substring(1) ];

            // Recruiter
            if( im.constructor.name == "Recruiter" ){
              let agencyOffers = environment.agencies[im.agency].offers;
              let matchingOffers = [];
              let nonmatchingOffers = [];
              for( let k = 0; k < agencyOffers.length; k++ ){
                let recruiterOffer = new Offer(
                  agencyOffers[k].employer, 
                  agencyOffers[k].destination, 
                  agencyOffers[k].documentation, 
                  im.id, 
                  agencyOffers[k].borderCrossing
                );
                if( baseOffer.destination == recruiterOffer.destination ){
                  if( this.preferenceMatch( this.preference, recruiterOffer, [m.id, im.id] ) ){
                    matchingOffers.push(recruiterOffer);
                  }else{
                    nonmatchingOffers.push(recruiterOffer);
                  }
                }
              }

              if( matchingOffers.length > 0){
                currentOffers.push([ [m.id, im.id], random(matchingOffers) ]);
              }else if( nonmatchingOffers.length > 0){
                currentOffers.push([ [m.id, im.id], random(nonmatchingOffers) ]);
              }
            }

            // myanmar doc broker
            if( im.constructor.name == "MyanmarDocumentBroker" ){
              let myanmarDocumentBrokerOffer = new Offer( 
                baseOffer.employer, 
                baseOffer.destination,
                ["passport"], 
                baseOffer.transport,
                baseOffer.borderCrossing
              );
              currentOffers.push( [ [m.id, im.id], myanmarDocumentBrokerOffer ] );
            }

            // smuggler
            if( im.constructor.name == "Smuggler" ){
              if( baseOffer.destination != "Mae Sot" ){
                let smugglerOffer = new Offer( 
                  baseOffer.employer, 
                  baseOffer.destination,
                  ["none"],
                  im.id, 
                  "unofficial2"
                );
                currentOffers.push( [ [m.id, im.id], smugglerOffer ] );
              }
            }
          }
        }
      }
    }

    return currentOffers;
  }
  

  //  Rule 9. solicited intermediary offers helper method
  solicitedIntermediaryOffers( pnIntermediaries, ims, emps ){
    let currentOffers = [];
    
    for( let i = 0; i < pnIntermediaries.length; i++ ){
      let im = ims[ pnIntermediaries[i].substring(1) ];
      if( im.constructor.name == "Recruiter" ){
        let agencyOffers = environment.agencies[im.agency].offers;
        let matchingOffers = [];
        let nonmatchingOffers = [];
        for( let j = 0; j < agencyOffers.length; j++ ){
          let recruiterOffer = new Offer(
            agencyOffers[j].employer, 
            agencyOffers[j].destination, 
            agencyOffers[j].documentation, 
            im.id, 
            agencyOffers[j].borderCrossing
          );
          if( this.preferenceMatch( this.preference, recruiterOffer, [im.id] ) ){
            matchingOffers.push(recruiterOffer);
          }else{
            nonmatchingOffers.push(recruiterOffer);
          }
        }
        
        if(matchingOffers.length > 0){
          currentOffers.push([ [im.id], random(matchingOffers) ]);
        }else{
          currentOffers.push([ [im.id], random(nonmatchingOffers) ]);
        }          
      }

      // facilitator
      if( im.constructor.name == "Facilitator" ){
        im.setupOffer(im.links,emps);
        let baseOffer = im.offer;
        currentOffers.push([ [im.id], baseOffer ]);

        for( let l = 0; l < im.links.intermediaries.length; l++ ){
          let cim = ims[ im.links.intermediaries[l] ];

          // Facilitator + Recruiter
          if( cim.constructor.name == "Recruiter" ){
            let agencyOffers = environment.agencies[cim.agency].offers;
            let matchingOffers = [];
            let nonmatchingOffers = [];
            for( let j = 0; j < agencyOffers.length; j++ ){
              let recruiterOffer = new Offer(
                agencyOffers[j].employer, 
                agencyOffers[j].destination, 
                agencyOffers[j].documentation, 
                cim.id, 
                agencyOffers[j].borderCrossing
              );
              if( this.preferenceMatch( this.preference, recruiterOffer, [im.id, cim.id] ) ){
                matchingOffers.push(recruiterOffer);
              }else{
                nonmatchingOffers.push(recruiterOffer);
              }
            }

            if(matchingOffers.length > 0){
              currentOffers.push([ [im.id, cim.id], random(matchingOffers) ]);
            }else{
              currentOffers.push([ [im.id, cim.id], random(nonmatchingOffers) ]);
            }    

          }

          // facilitator + smuggler
          if( cim.constructor.name == "Smuggler" ){
            if( baseOffer.destination == cim.offer.destination ){
              let smugglerOffer = new Offer(
                baseOffer.employer, 
                baseOffer.destination, 
                cim.offer.documentation, 
                cim.offer.transport, 
                cim.offer.borderCrossing
              );
              currentOffers.push( [ [im.id, cim.id], smugglerOffer ] ); 
            }  
          }

          // facilitator + myanmardocumentbroker
          if( cim.constructor.name == "MyanmarDocumentBroker" ){
            let mdbOffer = new Offer(
              baseOffer.employer, 
              baseOffer.destination, 
              ["passport"], 
              baseOffer.transport, 
              baseOffer.borderCrossing
            );
            currentOffers.push( [ [im.id, cim.id], mdbOffer ] );
          }

        }

      }
      
      // myanmar doc broker
      if( im.constructor.name == "MyanmarDocumentBroker" ){
        im.setupOffer();
        currentOffers.push( [ [im.id], im.offer ] );
      }

      // smuggler
      if( im.constructor.name == "Smuggler" ){
        currentOffers.push( [ [im.id], im.offer ] );
      }

    }

    return currentOffers;
  }



  //  Rule 9c. review solicited offers rule
  solicitedOffersSort( cos ){
    let currentOffers = cos;
    let currentOffersPreferred = [];
    let currentOffersNotPreferred = [];
    for( let i = 0; i < currentOffers.length; i++ ){
      if( this.preferenceMatch( this.preference, currentOffers[i][1], currentOffers[i][0] ) ){
        currentOffersPreferred.push( currentOffers[i] );
      }else{
        currentOffersNotPreferred.push( currentOffers[i] );
      }
    }
    return this.bestSolicitedOffer( currentOffersPreferred, currentOffersNotPreferred );
  }

  //  Rule 9. best solicited offer helper method
  bestSolicitedOffer( cpos, cnpos ){
    let bestOffer = null;
    if( cpos.length > 0 ){
      bestOffer = random(1) < 0.95 ? random(cpos) : null;
    }else if( cnpos.length > 0 ){
      bestOffer = random(1) < 0.5 ? random(cnpos) : null;
    }
    return bestOffer;
  }


  //  Rule 11. Seek Contacts
  seekContacts( ms, ims, ias, fs ){
    for( const [k, v] of Object.entries( ms ) ){
      if( this.family == v.family || fs[this.family].extendedFamilies.includes(v.family) ){
        if( v.state == "employed" && this.planningNetwork.filter( d => v.id ).length == 0 && random(1) < 0.7 ) this.planningNetwork.push( v.id );
      }else if( this.loc.dist( v.loc ) < this.vision && v.migrations.filter( d => d.completed ).length > 0 ){
        let pnis = v.planningNetwork.filter(member => member[0] == "i" && ims[ member.substring(1) ].constructor.name != "ThailandDocumentBroker" );
        for( let i=0; i<pnis.length; i++){
          if( this.planningNetwork.filter( d => d == pnis[i] ).length == 0 ) this.planningNetwork.push( pnis[i] );
        }
        if( ias[frameCount].filter( d => ( d.source == v.id && d.target == this.id ) || ( d.target == v.id && d.source == this.id ) ).length == 0 ){
          ias[frameCount].push( {"source":this.id, "target":v.id} );
        }
      }
    }

    for( let i=0; i < ims.length; i++ ){
      if( this.loc.dist( ims[i].loc ) < (this.vision*2) ){
        push();
        stroke( 0, 100 );
        strokeWeight( this.d*2 );
        line( this.loc.x, this.loc.y, ims[i].loc.x, ims[i].loc.y );
        pop();
        this.history[frameCount].offerLeads.intermediaries.push(ims[i].id);
        if( this.planningNetwork.filter( d => d == ims[i].id ).length == 0 ) this.planningNetwork.push(ims[i].id);
      }
    }
  }


    //  Rule 12a. continue planning decision
  determineDestination( p, ms ){
    if( random(1) < 0.1 ){
      this.state = "premigration";
      if( this.motivation - 0.1 < 0) this.history[ frameCount ].constraints.motivation.low = true;
      if( this.motivation - 0.1 > 1) this.history[ frameCount ].constraints.motivation.high = true;
      this.motivation = constrain(this.motivation - 0.1, 0, 1);
    }else{
      this.migrations[0].plan.destination = this.preferenceMatchDestination( p, ms );
    }
  }


  //  Rule 12b. destination decision
  preferenceMatchDestination( p, ms ){
    if( p == "proximity" ){
      return "Mae Sot";
    }else if( p == "sector" || p == "wage" ){
      return "Bangkok";    
    }else if(p == "legal" || p == "work" || p == "fees" || p == "intermediary"){
      let weightedDestinations = ["Bangkok", "Bangkok", "Bangkok", "Bangkok", "Mae Sot", "Mae Sot", "Mae Sot", "Mae Sot", "Phang Nga", "Phang Nga"];
      return random(weightedDestinations);
    }else if( p == "family" ){
      // location with any family members
      let destinationTotals = { "Tak": 0, "Mae Sot": 0, "Bangkok": 0, "Phang Nga": 0 };
      for( const [k, v] of Object.entries(ms) ) if( v.id != this.id && v.state == "employed" ) destinationTotals[v.destination] += 1;
      let sortedDestinationTotals = [];
      for( const [k, v] of Object.entries(destinationTotals) ) sortedDestinationTotals.push([k, v]);
      sortedDestinationTotals.sort( function( a, b ){ return b[1] - a[1]; });
      for( let i = 1; i < sortedDestinationTotals; i++ ){
        if( sortedDestinationTotals[i][1] == 0 ){
          sortedDestinationTotals.splice(i, 1);
          i--;
        }
      }
      return sortedDestinationTotals.length > 0 ? random(sortedDestinationTotals)[0] : "Mae Sot";
    }else if( p == "social" ){
      let destinationTotals = { "Tak": 0, "Mae Sot": 0, "Bangkok": 0, "Phang Nga": 0 };
      for( const [k, v] of Object.entries(ms) ) if( v.id != this.id && v.state == "employed" ) destinationTotals[v.destination] += 1;
      let sortedDestinationTotals = [];
      for( const [k, v] of Object.entries(destinationTotals) ) sortedDestinationTotals.push([k, v]);
      sortedDestinationTotals.sort( function( a, b ){ return b[1] - a[1]; });
      for( let i = 1; i < sortedDestinationTotals; i++ ){
        if( sortedDestinationTotals[i][1] < sortedDestinationTotals[0][1] ){
          sortedDestinationTotals.splice(i, 1);
          i--;
        }
      }
      return sortedDestinationTotals.length > 0 ? random(sortedDestinationTotals)[0] : "Mae Sot";
    }
  }


  //  Rule 13a. pre-transit documentation decision
  preTransitDocumentDecision( p, ms, ims, emps, ias, fs ){
    if( p == "legal" ){
      let r = random(1);
      let possibleDocumentation = [ ["passport"], ["passport", "work permit"], [""] ];
      let d = r < 0.15 ? possibleDocumentation[0] : r < 0.15 ? possibleDocumentation[1] : possibleDocumentation[2];
      this.migrations[0].plan.documentation = d;

      // randomly assign a new recruiter & then pick their best offer
      if( this.migrations[0].plan.documentation.includes("work permit") ){
        let newRecs = ims.filter( m => {
          return m.constructor.name == "Recruiter"  && 
          this.planningNetwork.filter(d => d == m.id).length == 0 && 
          this.migrations[0].migrationNetwork.filter(d => d == m.id).length == 0  
        });
        let rec = random( newRecs );

        let currentOffers = this.solicitedIntermediaryOffers( [rec.id], ims, emps );
        let currentOffersPreferred = [];
        let currentOffersNonPreferred = [];
        currentOffers = this.addPreferenceData( currentOffers, ms );
        for( let i = 0; i < currentOffers.length; i++ ){
          if( this.preferenceMatch( this.preference, currentOffers[i][1] ) ){
            currentOffersPreferred.push( currentOffers[i] );
          }else{
            currentOffersNonPreferred.push( currentOffers[i] );
          }
        }

        if( currentOffersPreferred.length > 0 ){
          let ro = random( currentOffersPreferred );
          this.migrations[0].plan = new Plan( ro[1] );
        }else if( currentOffersNonPreferred.length > 0 ){
          let o = random( currentOffersNonPreferred );
          this.migrations[0].plan = new Plan( o[1] );
        }

        this.planningNetwork.push( rec.id );
        this.migrations[0].migrationNetwork.push( rec.id );
        outputData[ frameCount ].ao["Recruiter"] += 1;
      }
    }
  }


  //  Rule 13b. determine documentation location
  determineDocumentationLocation( ims ){
    let cm = this.migrations[0];
    if( cm.plan.documentation.includes("work permit") ){
      let mni = cm.migrationNetwork.filter(n => n[0] == "i" && ims[ n.substring(1) ].constructor.name == "Recruiter" );
      for (let i = 0; i < mni.length; i++) {
        let im = ims[mni[i].substring(1)];
        // if (im.constructor.name == "Recruiter") {
        cm.documentationLocation = environment.agencies[im.agency].loc.copy();
        // }
      }
    }else if( cm.plan.documentation.includes("passport") ){
      if( this.home == "Magway" || this.home == "Rakhine" ){
        cm.documentationLocation = environment.offices[2].loc.copy();
      }else{
        cm.documentationLocation = environment.offices[1].loc.copy();
      }
    }else{
      // if neither documentation location should be?
    }
  }


  //  Rule 14a. get pre-transit documents
  //  Rule 15.  leave decision
  getPreTransitDocuments( ims ){
    let cm = this.migrations[0];
    if( typeof cm.documentationLocation == "undefined" ){
      this.leaveDecision(this.migrations[0].documentation);
    }else{
      if( p5.Vector.dist(this.loc, cm.documentationLocation) > 10 ){
        this.loc = p5.Vector.lerp(this.loc, cm.documentationLocation, 0.3);
        push();
        stroke("#eb5b5680");
        strokeWeight(this.d*0.5);
        line(this.loc.x, this.loc.y, cm.documentationLocation.x, cm.documentationLocation.y);
        pop();
        // 14b. respond to myanmar doc broker
        this.respondMyanmarDocumentBrokerOffer(ims);
      }else{
        this.getDocuments();
      }
    }
  }

  
  //  Rule 14b. respond to myanmar doc broker
  respondMyanmarDocumentBrokerOffer( ims ){
    let cm = this.migrations[0];
    let mdbs = ims.filter(i => i.constructor.name == "MyanmarDocumentBroker");

    for( let mdb = 0; mdb < mdbs.length; mdb++ ){
      if( this.loc.dist(this.loc, mdbs[mdb].loc) < mdbs[mdb].vision && cm.documentation.length == 0 ){
        if( this.wealth > mdbs[mdb].fees ){
          let noMdbAndR = true;
          let cmn = cm.migrationNetwork;
          if( 
            cmn.filter( d => d[0] == "i" && ( ims[ d.substring(1) ].constructor.name == "MyanmarDocumentBroker" || ims[ d.substring(1) ].constructor.name == "Recruiter" ) ).length == 0 &&
            cm.plan.documentation.includes("passport") 
          ){
            if( random(1) < 0.75 && cm.migrationNetwork.filter( d => d == mdbs[mdb].id ).length == 0 ){
              cm.migrationNetwork.push(mdbs[mdb].id);
              outputData[ frameCount ].ao["MyanmarDocumentBroker"] += 1;
              cm.plan.documentation = ["passport"];
              push();
              stroke("#3f4d8480");
              strokeWeight(this.d*0.5);
              line(this.loc.x, this.loc.y, mdbs[mdb].loc.x, mdbs[mdb].loc.y);
              pop();
              this.migrations[0].documentGetDuration = 10;
            }
          }
        }
      }
    }
  }

  
  //  Rule 14c. get documents rule
  getDocuments( ){
    if( this.migrations[0].documentGetInit == 0 ) this.migrations[0].documentGetInit = frameCount;
    
    if( this.migrations[0].documentGetDuration == 0 ){
      let cmdl = this.migrations[0].documentationLocation;
      let a = [];
      let o = [];
      for( const [k, v] of Object.entries(environment.agencies) ){
        if( v.loc.x == cmdl.x && v.loc.y == cmdl.y ) a.push(v.id);        
      }
      for( const [k, v] of Object.entries(environment.offices) ){
        if( v.loc.x == cmdl.x && v.loc.y == cmdl.y ) a.push(v.id);        
      }
      if( a.length == 1 ) this.migrations[0].documentGetDuration = 50;
      if( o.length == 1 ) this.migrations[0].documentGetDuration = 17;
    }

    if( frameCount - this.migrations[0].documentGetInit >= this.migrations[0].documentGetDuration ){
      if( this.migrations[0].documentGetDuration == 50 ){
        this.migrations[0].documentation.push( new Document( configData.documents[ "passport" ] ) ); 
        this.migrations[0].documentation.push( new Document( configData.documents[ "work permit" ], this.migrations[0].plan.employer ) );
      } 
      if( this.migrations[0].documentGetDuration == 10 ){
        this.migrations[0].documentation.push( new Document( configData.documents[ "passport" ] ) );
      }
      if( this.migrations[0].documentGetDuration == 17 ){
        if( random(1) < 0.75 ){
          this.migrations[0].documentation.push( new Document( configData.documents[ "passport" ] ) );
        }else{
          this.migrations[0].documentation.push( new Document( configData.documents[ "border pass" ] ) );
        } 
      }
      this.leaveDecision( this.migrations[0].hasDocument("passport") );
    }
  }


  //  Rule 15. leave decision
  leaveDecision( hp ){
    if( hp ){
      if( random(1) < 0.95 ){
        this.state = "transit";
        this.migrations[0].startTransit = frameCount;
      }else{
        this.goHome();
      }
    }else{
      if( this.migrations[0].plan.employer != null ){
        if( random(1) < 0.95 ){
          this.state = "transit";
          this.migrations[0].startTransit = frameCount;
        }else{
          this.goHome();
        }
      }else{
        if( random(1) < 0.8 ) this.goHome();
      }
    }
  }


  //  Rule 15. go home helper method
  goHome( ){
    if( this.motivation - 0.1 < 0) this.history[ frameCount ].constraints.motivation.low = true;
    if( this.motivation - 0.1 > 1) this.history[ frameCount ].constraints.motivation.high = true;
    this.motivation = constrain(this.motivation - 0.1, 0, 1);
    // walk home
    let homebs = environment.subareas[this.home].boundaries;
    if(
      !(this.loc.x > homebs[0].x && this.loc.x < homebs[1].x &&
        this.loc.y > homebs[0].y && this.loc.y < homebs[1].y)
    ){
      this.loc = createVector(random(homebs[0].x,homebs[1].x), random(homebs[0].y,homebs[1].y));
      push();
      stroke("#3b40e380");
      strokeWeight(this.d*0.5);
      line(this.loc.x, this.loc.y, this.migrations[0].documentationLocation.x, this.migrations[0].documentationLocation.y);
      pop();
    }
    this.state = "premigration";
  }


  // ---------------------------------------
  // ---------------------------------------
  // ---------------------------------------
  // INDIVIDUAL RULES : TRANSIT
  // ---------------------------------------
  // ---------------------------------------
  // ---------------------------------------


  transitWalk( ){

  }


  //  Rule 16 - 23
  transitUpdate( ){
    if( this.migrations[0].inMyawaddy ){
      if( this.migrations[0].plan.transport == "" ){
        //  Rule 17.
        this.transportDecision();
      }else if( this.migrations[0].plan.transport == "find smuggler" ){
        //  Rule 18.
        this.findSmuggler();
      }else if( this.migrations[0].plan.transport != "" ){
        if( this.migrations[0].leaveSmuggler == false ){
          push();
          stroke("#5ac4be");
          strokeWeight(this.d*0.5);
          line( this.loc.x, this.loc.y, intermediaries[ this.migrations[0].plan.transport.substring(1) ].loc.x, intermediaries[ this.migrations[0].plan.transport.substring(1) ].loc.y );
          pop();
        }else if( this.migrations[0].destination == "" ){
          //  Rule 19-21
          this.goToBorderAndDestination();
        }else{
          //  Rule 22-23
          this.findEmployer();
        }
      }
    }else{
      //  Rule 16
      this.goToMyawaddy();
    }

    this.migrations[0].removeExpiredDocuments();
    this.borderPassCosts();
    this.migrations[0].duration.transit += 1;
  }


  //  Rule 16. go to myawaddy  
  goToMyawaddy( ){
    let usingRecruiter = this.migrations[0].migrationNetwork.filter( d => d[0] == "i" && intermediaries[ d.substring(1) ].constructor.name == "Recruiter" ).length > 0;
    // if you aren't using a recruiter or 
    // if you are a recruiter are are ready to leave their agency
    if( !usingRecruiter || this.migrations[0].leaveAgency ){
      if( this.migrations[0].myawaddyLocation == null){
        this.migrations[0].myawaddyLocation = createVector(
          random( environment.subareas["Myawaddy"].boundaries[0].x + 20, environment.subareas["Myawaddy"].boundaries[1].x -20 ),
          random( environment.subareas["Yangon"].boundaries[0].y + 20, environment.subareas["Myawaddy"].boundaries[1].y - 20 ),
        );        
      }
      // go to myawaddy
      this.loc = p5.Vector.lerp(this.loc, this.migrations[0].myawaddyLocation, 0.5);
      push();
      stroke("#5ac4be");
      strokeWeight(this.d * 0.5);
      line(this.loc.x, this.loc.y, this.migrations[0].myawaddyLocation.x, this.migrations[0].myawaddyLocation.y);
      pop();
      if( this.loc.dist( this.migrations[0].myawaddyLocation ) < 5 ) this.migrations[0].inMyawaddy = true;
    }else{
      // wait at agency until
      // the min number of migrants going to the same employer
      // and then go to myawaddy as a group of migrants
      let agencyMigrantCount = 0;      
      for( const [k, v] of Object.entries(migrants) ){
        if( 
          this.id != v.id &&
          v.state == "transit" && 
          this.migrations[0].plan.employer == v.migrations[0].plan.employer && 
          this.migrations[0].documentationLocation.dist( v.loc ) <= 10 
        ){
          agencyMigrantCount++;
        }
      }
      if( agencyMigrantCount >= 2 ){
        this.migrations[0].leaveAgency = true;
      } 
    }
  }


  //  Rule 17. transport decision
  transportDecision( ){
    if( this.migrations[0].plan.destination == "Mae Sot" || this.migrations[0].plan.destination == "Tak" ){
      this.migrations[0].plan.transport = this.id;
      if( this.migrations[0].hasDocument("passport") ){
        this.migrations[0].plan.borderCrossing = "official";
      }else{
        this.migrations[0].plan.borderCrossing = random(1) <= 0.3 ? "official" : "unofficial1";
      }
    }else{
      if( this.migrations[0].hasDocument("passport") ){
        let r = random(1);
        this.migrations[0].plan.transport = r < 0.8 ? this.id : "find smuggler";
        this.migrations[0].plan.borderCrossing = r < 0.7 ? "official" : "unofficial1";
      }else{
        this.migrations[0].plan.transport = "find smuggler";
      }
      if( this.migrations[0].plan.transport == "find smuggler" ) this.migrations[0].initFindSmuggler = frameCount;
    }
  }


  //  Rule 18. find smuggler
  findSmuggler( ){
    if( frameCount - this.migrations[0].initFindSmuggler <= 30 ){
      this.loc = this.randomWalk( this.loc, this.stepSize * 2, environment.subareas["Myawaddy"].boundaries );
      let imsS = intermediaries.filter( s => s.constructor.name == "Smuggler" );
      let imsSMatches = [];
      for( let i = 0; i < imsS.length; i++ ){
        if( 
          this.loc.dist( imsS[i].loc ) < imsS[i].vision &&
          imsS[i].offer.destination == this.migrations[0].plan.destination  &&
          this.planningNetwork.filter( d => d == imsS[i].id ).length == 0
        ){
          imsSMatches.push(imsS[i]);
        }
      }
      imsSMatches.sort(function(a, b) { return b.fees - a.fees; });
      
      if( imsSMatches.length > 0 ){
        let s = imsSMatches[0];
        this.planningNetwork.push( s.id );
        this.migrations[0].migrationNetwork.push( s.id );
        outputData[ frameCount ].ao["Smuggler"] += 1;
        this.migrations[0].plan.transport = s.id;
        this.migrations[0].plan.borderCrossing = "unofficial2";
        this.migrations[0].leaveSmuggler = false;      
        s.passengerCurrent.push(this.id);
      }
    }else{
      // go home
      if( this.motivation - 0.1 < 0) this.history[ frameCount ].constraints.motivation.low = true;
      if( this.motivation - 0.1 > 1) this.history[ frameCount ].constraints.motivation.high = true;
      this.motivation = constrain( this.motivation - 0.1, 0, 1 );
      let homebs = environment.subareas[this.home].boundaries;
      if( this.home != "Myawaddy" ){
        let randHomeLoc = createVector(random(homebs[0].x,homebs[1].x), random(homebs[0].y,homebs[1].y));
        push();
        stroke("#3b40e380");
        strokeWeight(this.d*0.5);
        line(this.loc.x, this.loc.y, randHomeLoc.x, randHomeLoc.y);
        pop();
        this.loc = randHomeLoc.copy();
      }
      this.state = "premigration";
    }
  }


  //  Rule 19a. cross border and go to desination
  goToBorderAndDestination( ){
    let pbc = "O 1";
    if( this.migrations[0].plan.borderCrossing == "unofficial1" ) pbc = "U 1";
    if( this.migrations[0].plan.borderCrossing == "unofficial2" ) pbc = "U 2";
    let bc = p5.Vector.lerp(environment.subareas[ pbc ].boundaries[0], environment.subareas[ pbc ].boundaries[1], 0.5);
    if( typeof this.migrations[0].borderLocation == "undefined" ){
      this.loc = p5.Vector.lerp(this.loc, bc, 0.25);
      push();
      stroke("#5ac4be");
      strokeWeight(this.d * 0.5);
      line(this.loc.x, this.loc.y, bc.x, bc.y);
      pop();

      if( this.loc.dist( bc ) < 5 ){
        if(scenario == 1 && this.migrations[0].plan.borderCrossing != "official" ){
          // SCENARIO 1
          // migrant immediately sent home   
          if( this.motivation - 0.1 < 0) this.history[ frameCount ].constraints.motivation.low = true;
          if( this.motivation - 0.1 > 1) this.history[ frameCount ].constraints.motivation.high = true;
          this.motivation = constrain(this.motivation - 0.1, 0, 1);
          let homebs = environment.subareas[this.home].boundaries;
          let randHomeLoc = createVector(random(homebs[0].x,homebs[1].x), random(homebs[0].y,homebs[1].y));
          push();
          stroke("#3b40e380");
          strokeWeight(this.d*0.5);
          line(this.loc.x, this.loc.y, randHomeLoc.x, randHomeLoc.y);
          pop();
          this.loc = randHomeLoc.copy();
          this.state = "premigration";
        }else{
          this.migrations[0].borderLocation = bc;
          if(
            pbc == "O 1" &&
            !this.migrations[0].hasDocument("passport") &&
            !this.migrations[0].hasDocument("border pass")
          ){
            this.migrations[0].documentation.push( new Document( configData.documents[ "border pass" ] ) );          
          }            
        }
      }
    }else{

      if( this.migrations[0].destinationLocation == null ){
        if( this.migrations[0].plan.employer != null ){
          let e = this.migrations[0].plan.employer.substring(1);
          let h = employers[e].loc.copy();
          this.migrations[0].destinationLocation = h;
        }else{
          if( typeof environment.subareas[ this.migrations[0].plan.destination ] == "undefined") debugger;
          this.migrations[0].destinationLocation = createVector(
            random( environment.subareas[ this.migrations[0].plan.destination ].boundaries[0].x + 20, environment.subareas[this.migrations[0].plan.destination].boundaries[1].x - 20),
            random( environment.subareas[ this.migrations[0].plan.destination ].boundaries[0].y + 20, environment.subareas[this.migrations[0].plan.destination].boundaries[1].y - 20)
          );            
        }
      }
      this.loc = p5.Vector.lerp( this.loc, this.migrations[0].destinationLocation, 0.25 );
      push();
      strokeWeight(this.d * 0.5);
      stroke("#5ac4be");
      line(this.loc.x, this.loc.y, bc.x, bc.y);
      stroke("#5ac4be60");
      line(this.loc.x, this.loc.y, this.migrations[0].destinationLocation.x, this.migrations[0].destinationLocation.y);
      pop();

      if( this.loc.dist( this.migrations[0].destinationLocation ) < 5 ){
        if( typeof this.migrations[0].totalMigrationCosts == "undefined" ) this.migrationCosts();
        this.determinePrecarity(); 
        if( this.migrations[0].plan.employer != null ){
          let cm = this.migrations[0];
          this.migrations[0].currentEmployer = cm.plan.employer;
          this.migrations[0].destination = cm.plan.destination;
          this.migrations[0].migrationNetwork.push( cm.currentEmployer );
          this.state = "employed";
          this.migrations[0].startEmployed = frameCount;
          this.migrations[0].pathway = this.determinePathway( this.migrations[0].migrationNetwork );
        }else{
          this.migrations[0].destination = this.migrations[0].plan.destination;
        }
      }
    }
  }

  determinePathway( cmn ){
    let p = "";
    
    
    if( cmn.includes(this.id) && cmn.filter( a => a[0] == "e").length == 1 && cmn.length == 2 ){
      p = "solo";
    } else if( cmn.length -1 - cmn.filter( a => a == this.id ).length  == cmn.filter( a => a != this.id && a[0] == "m" ).length ){
      // family: includes only family 
      p = "family";    
    } else if( cmn.filter( a => a[0] == "i" && intermediaries[ a.substring(1) ].constructor.name == "Recruiter" ).length > 0 ){
      // mou: includes a recruiter
      p = "mou";
    } else {
      p = "informal";
    }
    return p;
  }

  //  Rule 20a-b.
  migrationCosts( ){
    // 20a. migration costs rule
    let cm = this.migrations[0];
    let costFees = 0;
    let costFailedPassport = 0;
    let costDocumentation = 0;
    let costDocumentationTransit = 0;
    let costTransit = this.migrations[0].duration.transit * 0.00001;
    // cost of intermediary fees
    let cmmni = cm.migrationNetwork.filter(i => i[0] == "i");
    for( let i = 0; i < cmmni.length; i++ ) costFees += intermediaries[cmmni[i].substring(1)].fees;
    // cost of failed passport
    if( cm.plan.documentation.includes("passport") && !cm.hasDocument("passport") ) costFailedPassport = 0.01;
    // cost of documentation
    for( let i = 0; i < cm.documentation.length; i++ ) costDocumentation += cm.documentation[i].cost;
    // cost of documentation transit
    if( ( cm.hasDocument("passport") && (this.home == "Bago" || this.home == "Rakhine") ) || ( cm.hasDocument("work permit") && this.home == "Magway" ) ){
      costDocumentationTransit = 0.01;    
    } 
    // cost of total migration
    this.migrations[0].totalMigrationCosts = costFees + costFailedPassport + costDocumentation + costDocumentationTransit + costTransit;
    
    // 20b. acquired migration debt rule
    // update current debt
    let debt = this.wealth - cm.totalMigrationCosts < 0 ? abs(this.wealth - cm.totalMigrationCosts) : 0;
    if( families[this.family].history[ cm.leaveDecision ].sum > 0.2 ){
      this.debt.family += debt;
    }else{
      this.debt.industry += debt;
    }
    // update current wealth
    if( this.wealth - this.migrations[0].totalMigrationCosts < 0) this.history[ frameCount ].constraints.wealth.low = true;
    if( this.wealth - this.migrations[0].totalMigrationCosts > 1) this.history[ frameCount ].constraints.wealth.high = true;
    this.wealth = constrain( this.wealth - this.migrations[0].totalMigrationCosts, 0, 1 );
    
    cm.destination = cm.plan.destination;
    cm.destinationInit = frameCount;    
  }


  //  Rule 20c. recurring border pass cost
  borderPassCosts( ){
    let t = this.migrations[0].duration.transit + this.migrations[0].duration.employed;
    if( t % 7 == 0 && this.migrations[0].hasDocument("border pass") ){
      let bp = this.migrations[0].documentation.filter( d => d.type == "border pass")[0];
      if( this.wealth - bp.cost < 0) this.history[ frameCount ].constraints.wealth.low = true;
      if( this.wealth - bp.cost > 1) this.history[ frameCount ].constraints.wealth.high = true;
      this.wealth = constrain( this.wealth - bp.cost, 0, 1 );
    }
  }


  //  Rule 21a-b. livelihood pressure and precarity rule
  determinePrecarity( ){
    let precarity = 0;
    let livelihoodPressure = 0;
    let socioLegalWorkStatus = 0;
    let destinationKnowledge = 0;
    let cm = this.migrations[0];
    let cmEmp = employers[ cm.currentEmployer.substring(1) ];
    if( this.debt.family > this.wealth ) livelihoodPressure += 0.1;
    if( this.debt.industry > 0 ) livelihoodPressure += 0.2;
    let rw = 1;
    for( let i = 0; i < Family.relativeWealths[this.home].length; i++ ){
      if( Family.relativeWealths[this.home][i][0] == this.family ){
        rw = i / Family.relativeWealths[this.home].length;
        break;
      } 
    }
    if( rw <= 0.25 ) livelihoodPressure += 0.1; // lowest
    if( typeof cmEmp == "undefined" || cmEmp.monthlyWage < 0.09 ) livelihoodPressure += 0.1;
    if( (cm.hasDocument("none") || cm.documentation.length ==0 ) && (cm.destination == "Mae Sot" || cm.destination == "Tak") ) socioLegalWorkStatus += 0.1;
    if( !cm.hasDocument("work permit") && (cm.destination == "Bangkok" || cm.destination == "Phang Nga") ) socioLegalWorkStatus += 0.2;

    let emps = employers.filter( e => {
      let sameDestinationSubArea = e.home == cm.destination;
      let hasVacancy = e.currentEmployees < e.maxEmployees;
      let requiredDocsSatisfied = true;
      for( let i=0; i<e.requiredDocuments.length; i++ ){
        if( !this.migrations[0].hasDocument( e.requiredDocuments[i] ) ){
          requiredDocsSatisfied = false;
          break;
        }
      }
      let wagesHigherThanCurrent = typeof cmEmp == "undefined" ? true : e.monthlyWage > cmEmp.monthlyWage;
      return (sameDestinationSubArea && hasVacancy && requiredDocsSatisfied && wagesHigherThanCurrent);
    });

    if( emps.length == 0 ) destinationKnowledge += 0.1;
    if( this.migrations.length == 1 ) destinationKnowledge += 0.1;
    let noFam = true;
    let fam = families[ this.family ].members;
    for( let i=0; i<fam.length; i++ ){
      let m = migrants[ fam[i] ];
      if( m.id != this.id && m.state == "employed" && m.migrations[0].destination == cm.destination ){
        noFam = false;
        break;
      }
    }
    if( noFam ) destinationKnowledge += 0.1;
    
    precarity = livelihoodPressure + socioLegalWorkStatus + destinationKnowledge;
    this.migrations[0].precarity = precarity;//.toFixed(3);
  }


  //  Rule 22. find employer 
  //  Rule 23. accept employer
  findEmployer( ){    
    let cm = this.migrations[0];
    if( frameCount - cm.destinationInit <= 100 ){
      if( cm.plan.employer == null ){
        this.loc = this.randomWalk(this.loc, this.stepSize*5, environment.subareas[cm.destination].boundaries);
        let emps = employers.filter(e => e.home == cm.destination);
        for( let i = 0; i < emps.length; i++ ){
          if( p5.Vector.dist(this.loc, emps[i].loc) < emps[i].vision / 2 ){
            if( emps[i].currentEmployees < emps[i].maximumEmployees ){
              if( random(1) < 0.9 ){
                cm.currentEmployer = emps[i].id;
                cm.migrationNetwork.push(emps[i].id);
                fill(0,0,255, 50);
                circle(emps[i].loc.x, emps[i].loc.y, emps[i].vision);
                this.state = "employed";
                cm.startEmployed = frameCount;
                this.migrations[0].pathway = this.determinePathway( this.migrations[0].migrationNetwork ); 
              }
            }
          }
        }
      }
    }else{
      if( cm.plan.employer == null ){
        // go home
        if( this.motivation - 0.1 < 0) this.history[ frameCount ].constraints.motivation.low = true;
        if( this.motivation - 0.1 > 1) this.history[ frameCount ].constraints.motivation.high = true;
        this.motivation = constrain(this.motivation - 0.1, 0, 1);
        let homebs = environment.subareas[this.home].boundaries;
        let randHomeLoc = createVector(random(homebs[0].x,homebs[1].x), random(homebs[0].y,homebs[1].y));
        push();
        stroke("#3b40e380");
        strokeWeight(this.d*0.5);
        line(this.loc.x, this.loc.y, randHomeLoc.x, randHomeLoc.y);
        pop();
        this.loc = randHomeLoc.copy();
        this.state = "premigration";
      }
    }
  }


  // ---------------------------------------
  // ---------------------------------------
  // ---------------------------------------
  // INDIVIDUAL RULES : EMPLOYED
  // ---------------------------------------
  // ---------------------------------------
  // ---------------------------------------


  //  Rule 24-27
  employedUpdate(  ){
    this.findThailandDocumentBroker();
    //  Rule 24-27
    this.work(this.preference);

    this.migrations[0].removeExpiredDocuments();
    this.borderPassCosts();
    this.migrations[0].history[frameCount] = { "precarity" : this.migrations[0].precarity };
    this.migrations[0].duration.employed += 1;
  }


  findThailandDocumentBroker( ){
    let imsTDBs = intermediaries.filter( s => s.constructor.name == "ThailandDocumentBroker" );
    for( let t = 0; t < imsTDBs.length; t++ ){
      let tdb = imsTDBs[t];
      if( p5.Vector.dist( this.loc, tdb.loc ) < tdb.vision ){
        if( this.planningNetwork.filter( d => d == tdb.id ).length == 0 ){
          this.planningNetwork.push( tdb.id );
          push();
          fill(0, 0, 255, 50);
          circle(tdb.loc.x, tdb.loc.y, tdb.vision * 2);
          pop();
        }
      }
    }
  }
 

  //  Rule 24. work
  work( p ){
    let cm = this.migrations[0]; 
    let wealthChange = 1;
    wealthChange = this.monthlyWealthFluctuation( wealthChange, this.monthlyWealthFluctuationOffset );
    if( this.wealth * wealthChange < 0) this.history[ frameCount ].constraints.wealth.low = true;
    if( this.wealth * wealthChange > 1) this.history[ frameCount ].constraints.wealth.high = true;
    this.wealth = constrain( this.wealth * wealthChange, 0, 1 );
    
    if( (frameCount - cm.startEmployed) % 180 == 0 ){ // 6 month check
      this.leaveJobDecision( p );
    }else if( (frameCount - this.monthlyWealthFluctuationOffset) % 30 != 0 ){
      let r = random(1);
      if( p == "social" || p == "family" ){
        this.workPreference( r, 0.01, 0.08, 0.01, 0.00 );
      }else if( p == "legal" ){
        this.workPreference( r, 0.08, 0.01, 0.01, 0.00 );
      }else{
        this.workPreference( r, 0.01, 0.02, 0.01, 0.01 );
      }
    }else{
      this.wagesAndOvertime();
    }
  }


  //  Rule 24. helper method
  workPreference( r, rtdb, f, rhe, ce ){
    if( r <= rtdb ){
      this.requestThailandDocumentBrokerOffer();
    }else if( r <= rtdb + f ){
      this.inviteFamily();
    }else if( r <= rtdb + f + rhe ){
      this.returnHomeEarly( this.preference );
    }else if( r <= rtdb + f + rhe + ce ){
      let cm = this.migrations[0];
      let cmEmp = employers[ cm.currentEmployer.substring(1) ];
      this.attemptChangeEmployer( cm, cmEmp );
    }else{
      // skip all rules
    }
  }
  

  //  Rule 25a. request thai document broker
  requestThailandDocumentBrokerOffer( ){
    if( !this.migrations[0].hasDocument("work permit") ){
      let pnis = this.planningNetwork.filter( i => i[0] == "i" );
      let pniTDBs = pnis.filter( i => intermediaries[i.substring(1)].constructor.name == "ThailandDocumentBroker" );
      let tdbs = pniTDBs;
      let elis = employers[ this.migrations[0].currentEmployer.substring(1) ].links.intermediaries;
      if( elis > 0 ) tdbs.push( "i" + elis[0] );

      if( tdbs.length > 0 ){
        let tdbid = random(tdbs);
        let tdb = intermediaries[ tdbid.substring(1) ];
        
        if( this.migrations[0].migrationNetwork.filter( d => d == tdb.id ).length == 0 ){
          this.migrations[0].migrationNetwork.push( tdb.id );
          outputData[ frameCount ].ao["ThailandDocumentBroker"] += 1;
        }
        
        let deductions = tdb.fees;
        for( let i = 0; i < tdb.offer.documentation.length; i++ ){
          deductions += bahtToFloat( configData.documents[ tdb.offer.documentation[i] ].cost );
        }
        let debt = this.wealth - deductions < 0 ? abs(this.wealth - deductions) : 0;
        this.debt.industry += debt;
        if( this.wealth - deductions < 0) this.history[ frameCount ].constraints.wealth.low = true;
        if( this.wealth - deductions > 1) this.history[ frameCount ].constraints.wealth.high = true;
        this.wealth = constrain( this.wealth - deductions, 0, 1 );

        if( random(1) < tdb.completionRate ){
          this.migrations[0].documentation.push( new Document( configData.documents[ "work permit" ], this.migrations[0].currentEmployer ) );
          if( !this.migrations[0].hasDocument("passport") ){
            this.migrations[0].documentation.push( new Document( configData.documents[ "passport" ] ) );
          } 
        }
        this.determinePrecarity();
      }
    }
  }


  //  Rule 25b. invite family
  inviteFamily( ){
    let cm = this.migrations[0];
    if( cm.precarity < 0.8 ){
      if( employers[ cm.currentEmployer.substring(1) ].currentEmployees < employers[ cm.currentEmployer.substring(1) ].maximumEmployees ){
        this.sortAndPickFamilyMember(cm);
      }else{
        if( random(1) < 0.5 ) this.sortAndPickFamilyMember(cm);
      }
    }
  }


  //  Rule 25b. helper method
  sortAndPickFamilyMember( cm ){
    // sort extended family memebers by highest motivation and premigration state  
    let fms = [];
    let fs = [this.family].concat(families[this.family].extendedFamilies);
    for( let i = 0; i < fs.length; i++ ){
      let f = families[ fs[i] ].members;
      for( let j = 0; j < f.length; j++ ){
        if( migrants[f[j]].state == "premigration" ) fms.push( [f[j], migrants[f[j]].motivation] );
      }
    }
    fms.sort(function(a, b) { return b[1] - a[1]; });

    // make offer to highest motivated premigration extended family member           
    if( fms.length > 0 ){
      let f = migrants[ fms[0][0] ];
      if( f.history[frameCount].offerLeads.migrants.filter( d => d == this.id ).length == 0 ){
        migrants[ fms[0][0] ].history[frameCount].offerLeads.migrants.push( this.id );
        push();
        stroke("#31435490");
        strokeWeight(this.d*0.5);
        drawingContext.setLineDash([20, 5, 5, 5, 5, 5, 5, 5]);
        line(this.loc.x, this.loc.y, f.loc.x, f.loc.y);
        pop();
      }
      
      if( f.planningNetwork.filter( d => d == this.id ).length == 0 ){
        migrants[ fms[0][0] ].planningNetwork.push( this.id );
      }
    }
  }


  //  Rule 25c. Return Home Early
  returnHomeEarly( p ){
    let cmEmp = employers[this.migrations[0].currentEmployer.substring(1)];
    if( !this.migrations[0].hasDocument("work permit") ){
      if( random(1) < 0.2 ){ //go home because Im deported
        this.returnHomeEarlySub();
      }
    }else{
      if(
        (p == "sector" && (cmEmp.sector != "manufacturing" && cmEmp.sector != "services")) ||
        (p == "wage" && cmEmp.wage < 0.09) || 
        (p == "proximity" && ( this.migrations[0].destination == "Bangkok" && this.migrations[0].destination == "Phang Nga"))
      ){
        if( random(1) < 0.2 ){ //go home because not happy
          this.returnHomeEarlySub();
        }
      }
    }
  }

  //  Rule 25c. helper method
  returnHomeEarlySub( ){
    if( this.motivation - 0.1 < 0) this.history[ frameCount ].constraints.motivation.low = true;
    if( this.motivation - 0.1 > 1) this.history[ frameCount ].constraints.motivation.high = true;
    this.motivation = constrain( this.motivation - 0.1, 0, 1 );
    
    let homebs = environment.subareas[ this.home ].boundaries;
    let randHomeLoc = createVector( random( homebs[0].x, homebs[1].x ), random( homebs[0].y, homebs[1].y ) );
    push();
    stroke("#3b40e380");
    strokeWeight(this.d*0.5);
    line(this.loc.x, this.loc.y, randHomeLoc.x, randHomeLoc.y);
    pop();
    this.loc = randHomeLoc.copy();
    this.state = "premigration";
    this.migrations[0].completed = true;
    if( this.wealth > this.debt.family ){
      this.wealth -= this.debt.family;
      this.debt.family = 0;
    }
    if( this.wealth > 0){
      let mems = families[ this.family ].members;
      let pay = this.wealth / mems.length;
      this.wealth = 0;
      for( let i=0; i<mems.length; i++ ){
        if( migrants[ mems[ i ] ].wealth + pay < 0) this.history[ frameCount ].constraints.wealth.low = true;
        if( migrants[ mems[ i ] ].wealth + pay > 1) this.history[ frameCount ].constraints.wealth.high = true;
        migrants[ mems[ i ] ].wealth = constrain( migrants[ mems[ i ] ].wealth + pay, 0, 1 );
      }
    }
  }

  // Rule 26a. wages and overtime rule
  wagesAndOvertime( ){
    let debtPayRate = 0.5;
    let wagesReceived = 0;
    let interestRate = 1.07;
    let emp = employers[this.migrations[0].currentEmployer.substring(1)];
    
    let deductionRate = emp.monthlyDeductionRate;
    let overtimeOwed = emp.overtimeHours * emp.overtimeHourlyWage;
    let wagesOwed = emp.monthlyWage + overtimeOwed;

    // 26b-e. deductions and paid wages rule
    if( this.debt.industry > 0 ){
      this.debt.industry = (this.debt.industry * interestRate) - (wagesOwed * debtPayRate);
      deductionRate += debtPayRate;
    }
    wagesReceived = wagesOwed * deductionRate;
    
    let debt = this.wealth + wagesReceived < 0 ? abs( this.wealth + wagesReceived ) : 0;
    this.debt.industry = constrain( this.debt.industry + debt, 0, 1);
    if( this.wealth + (wagesReceived/2) < 0) this.history[ frameCount ].constraints.wealth.low = true;
    if( this.wealth + (wagesReceived/2) > 1) this.history[ frameCount ].constraints.wealth.high = true;
    this.wealth = constrain( this.wealth + (wagesReceived/2), 0, 1 );
    this.determinePrecarity();
  }


  //  Rule 27a. leave job decision
  leaveJobDecision( p ){
    let cm = this.migrations[0];
    let cmEmp = employers[ cm.currentEmployer.substring(1) ];
    if( this.debt.industry > 0 ){
      // stay at current employer 
    }else{
      let savingsGoal = cmEmp.monthlyWage * 3;
      let r = random(1);
      if( 
        ( p == "wages" && cmEmp.monthlyWage < 0.09 ) || 
        ( p == "sector" && ( cmEmp.sector != "manufacturing" && cmEmp.sector != "services" ) ) 
      ){
        if( this.wealth > savingsGoal + this.debt.family ){
          this.leaveJobDecisionSub( r, 0.1, 0.1, cm, cmEmp );
        }else{
          this.leaveJobDecisionSub( r, 0.1, 0.6, cm, cmEmp );
        }
      }else{
        if( this.wealth > savingsGoal + this.debt.family ){
          this.leaveJobDecisionSub( r, 0.5, 0, cm, cmEmp );
        }else{
          this.leaveJobDecisionSub( r, 0.3, 0.6, cm, cmEmp );
        }
      }
    }
  }

  //  Rule 27. leave job decision helper method
  leaveJobDecisionSub( r, sce, ace, cm, cmEmp ){
    if( r < sce ){ 
      // stay at current employer
    }else if( r < sce + ace ){
      this.attemptChangeEmployer( cm, cmEmp );
    }else{
      this.returnHome();
    }
  }
  
  
  //  Rule 27b. Return home decision
  returnHome( ){
    let savingsGoal = employers[ this.migrations[0].currentEmployer.substring(1) ].monthlyWage * 3;
    if( this.wealth > savingsGoal + this.debt.family ){
      if( this.influence * 1.25 < 0) this.history[ frameCount ].constraints.influence.low  = true;
      if( this.influence * 1.25 > 1) this.history[ frameCount ].constraints.influence.high = true;
      this.influence = constrain( this.influence * 1.25, 0, 1);
    } else{
      this.planningNetwork = [];        
    }   
    let homebs = environment.subareas[ this.home ].boundaries;
    let randHomeLoc = createVector( random( homebs[0].x, homebs[1].x ), random( homebs[0].y, homebs[1].y ) );
    push();
    stroke("#3b40e380");
    strokeWeight(this.d*0.5);
    line(this.loc.x, this.loc.y, randHomeLoc.x, randHomeLoc.y);
    pop();
    this.loc = randHomeLoc.copy();
    this.state = "premigration";
    this.migrations[0].completed = true;
    if( this.wealth > this.debt.family ){
      this.wealth -= this.debt.family;
      this.debt.family = 0;
    }
    if( this.wealth > 0){
      let mems = families[ this.family ].members;
      let pay = this.wealth / mems.length;
      this.wealth = 0;
      for( let i=0; i<mems.length; i++ ){
        if( migrants[ mems[ i ] ].wealth + pay < 0) this.history[ frameCount ].constraints.wealth.low = true;
        if( migrants[ mems[ i ] ].wealth + pay > 1) this.history[ frameCount ].constraints.wealth.high = true;
        migrants[ mems[ i ] ].wealth = constrain( migrants[ mems[ i ] ].wealth + pay, 0, 1 );
      }
    }

  }

  //  Rule 27c. find new employer
  attemptChangeEmployer( cm, cmEmp ){    
    // employers that are in the same subarea have a vacancy and are satisfied with migrant's documentation
    // employers that have higher wages than the current employer or satisfies sector or wage 
    let emps = employers.filter( e => {
      let sameDestinationSubArea = e.home == cm.destination;
      let hasVacancy = e.currentEmployees < e.maximumEmployees;
      let requiredDocsSatisfied = true;
      if(e.requiredDocuments != "none"){
        if( !this.migrations[0].hasDocument( e.requiredDocuments ) ){
          requiredDocsSatisfied = false;
        }           
      }

      let wagesHigherThanCurrent = e.monthlyWage > cmEmp.monthlyWage;
      let preferenceSatisfied = false;
      if( this.preference == "wages" && e.monthlyWage >= 0.09) preferenceSatisfied = true;
      if( this.preference == "sector" && ( e.sector == "manufacturing" || e.sector == "services" ) ) preferenceSatisfied = true;
      return ( sameDestinationSubArea && hasVacancy && requiredDocsSatisfied && ( wagesHigherThanCurrent || preferenceSatisfied ) );
    });

    if(emps.length > 0){
      let emp = random(emps);
      this.migrations[0].currentEmployer = emp.id;
      this.migrations[0].migrationNetwork.push( emp.id );
      this.loc = emp.loc.copy();
      this.migrations[0].documentation = this.migrations[0].documentation.filter( d => d.type != "work permit");
    }else{
      this.returnHome();
    }
  }


  randomNormalizedBool( percent ){ return random(1) < percent ? true : false }


  // --- Class methods ------------------------

  static setupPopulation( ms, cdms, esa ){
    let familyNum = 0;

    for( const [k, v] of Object.entries(cdms) ){
      let home = esa[k];
      let migrantNum = 0;

      //family
      while( migrantNum < v ){
        familyNum++;
        families[familyNum] = new Family(familyNum, k);

        const familyLoc = createVector(
          random(home.boundaries[0].x + 25, home.boundaries[1].x - 25),
          random(home.boundaries[0].y + 25, home.boundaries[1].y - 25)
        );
        const familySize = v - migrantNum > 5 ? floor(random(5)) + 1 : v - migrantNum;

        for( let i = 1; i <= familySize; i++ ){
          migrantNum++;
          let id = `m${Object.keys(ms).length}`;
          let loc = familyLoc.copy().add([cos(TWO_PI * (i / familySize)) * 10, sin(TWO_PI * (i / familySize)) * 10, 0]);
          ms[id] = new Migrant(id, familyNum, loc, k, 5);
          families[familyNum].members.push(id);
        }
      }

    }
  }


  static drawPopulation( ms ){
    push();
    strokeWeight(ms['m0'].d);
    beginShape(POINTS);
    for( const [k, v] of Object.entries(ms) ){
      if (v.state == "employed") {
        stroke("#74ec3980");
        strokeWeight(ms['m0'].d*0.5);
        line(v.loc.x, v.loc.y, employers[v.migrations[0].currentEmployer.substring(1)].loc.x, employers[v.migrations[0].currentEmployer.substring(1)].loc.y);
        stroke(0);
      }
      strokeWeight(ms['m0'].d);
      stroke("#314354");
      vertex(v.loc.x, v.loc.y);
    }
    endShape();
    pop();
  }


  static drawPopulationInteractions( ms, ias ){
    push();
    strokeWeight(ms['m0'].d * 2);
    stroke(0, 50);
    beginShape(LINES);
    for( let i = 0; i < ias[frameCount].length; i++ ){
      vertex(ms[ias[frameCount][i].source].loc.x, ms[ias[frameCount][i].source].loc.y);
      vertex(ms[ias[frameCount][i].target].loc.x, ms[ias[frameCount][i].target].loc.y);
    }
    endShape();
    pop();
  }


  static movePopulation( ms ){
    for( const [k, v] of Object.entries(ms) ){
      v.walk();
    }
  }


  static updateWealthPopulation( ms ){
    for( const [k, v] of Object.entries(ms) ){
      v.updateWealth();
    }
  }


  static storeStateAndWealthPopulation( ms ){
    for( const [k, v] of Object.entries(ms) ){
      v.history[frameCount]["s"] = v.state;
      v.history[frameCount]["w"] = v.wealth;
      v.history[frameCount]["m"] = v.motivation;
      v.history[frameCount]["i"] = v.influence;
    }
  }


  static updatePopulation( ms, fs, frw, ias, ims, emps ){
    let migs = [];
    for( const [k, v] of Object.entries(ms) ){ migs.push( [ v.id, v.state ] ); }
    migs.sort(function(a, b){ 
      let s = -1;
      if( b[1] == "employed" && a[1] == "employed" ){
        s = 0;
      }else if( b[1] == "employed" && a[1] != "employed" ){
        s = 1;
      }
      return s;
    });
    for( let i=0; i<migs.length; i++ ){
      let v = migrants[ migs[i][0] ];
      v.update(ms, fs, frw[v.home], ias, ims, emps, v.history[frameCount].offerLeads, v.motivation, v.motivationThreshold);
    }
  }


}
