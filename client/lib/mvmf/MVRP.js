
/*
import { MV   } from '@metaversalcorp/mvmf';
import '@metaversalcorp/mvsb';
import '@metaversalcorp/mvxp';

*/
/*
const { MV   } = require ('@metaversalcorp/mvmf');
require ('@metaversalcorp/mvsb');
require ('@metaversalcorp/mvxp');
*/

MV.MVRP     = MV.Library ('MVRP',     'Copyright 2023-2024 Metaversal Corporation. All rights reserved.', 'Metaversal RP1 Platform', '0.23.21');

MV.MVRP.Class.FLOAT3 = class extends MV.MVMF.Class.BASE
{
   constructor (fX, fY, fZ)
   {
      super ();

      this.Set (fX, fY, fZ);
   }

   Set (fX, fY, fZ)
   {
      this.fX = fX;
      this.fY = fY;
      this.fZ = fZ;
      this.fW = 0;
   }

   static MAP =
   {
      fX                : MV.MVSB.MAP.FIELD.FLOAT,
      fY                : MV.MVSB.MAP.FIELD.FLOAT,
      fZ                : MV.MVSB.MAP.FIELD.FLOAT,
   };
}

MV.MVRP.Class.FLOAT4 = class extends MV.MVMF.Class.BASE
{
   constructor (fX, fY, fZ, fW)
   {
      super ();

      this.Set (fX, fY, fZ, fW);
   }

   Set (fX, fY, fZ, fW)
   {
      this.fX = fX;
      this.fY = fY;
      this.fZ = fZ;
      this.fW = fW;
   }

   static MAP =
   {
      fX                : MV.MVSB.MAP.FIELD.FLOAT,
      fY                : MV.MVSB.MAP.FIELD.FLOAT,
      fZ                : MV.MVSB.MAP.FIELD.FLOAT,
   };
}

MV.MVRP.Class.DOUBLE3 = class extends MV.MVMF.Class.BASE
{
   constructor (dX, dY, dZ)
   {
      super ();

      this.Set (dX, dY, dZ);
   }

   Set (dX, dY, dZ)
   {
      this.dX = dX;
      this.dY = dY;
      this.dZ = dZ;
   }

   static MAP =
   {
      dX                : MV.MVSB.MAP.FIELD.DOUBLE,
      dY                : MV.MVSB.MAP.FIELD.DOUBLE,
      dZ                : MV.MVSB.MAP.FIELD.DOUBLE,
   };
}

MV.MVRP.Class.DOUBLE4 = class extends MV.MVMF.Class.BASE
{
   constructor (dX, dY, dZ, dW)
   {
      super ();

      this.Set (dX, dY, dZ, dW);
   }

   Set (dX, dY, dZ, dW)
   {
      this.dX = dX;
      this.dY = dY;
      this.dZ = dZ;
      this.dW = dW;
   }

   static MAP =
   {
      dX                : MV.MVSB.MAP.FIELD.DOUBLE,
      dY                : MV.MVSB.MAP.FIELD.DOUBLE,
      dZ                : MV.MVSB.MAP.FIELD.DOUBLE,
      dW                : MV.MVSB.MAP.FIELD.DOUBLE,
   };
}

MV.MVRP.Class.FGEOPOS = class extends MV.MVMF.Class.BASE
{
   constructor (fLatitude, fLongitude, fRadius)
   {
      super ();

      this.Set (fLatitude, fLongitude, fRadius);
   }

   Set (fLatitude, fLongitude, fRadius)
   {
      this.fLatitude  = fLatitude;
      this.fLongitude = fLongitude;
      this.fRadius    = fRadius;
   }

   static MAP =
   {
      fLatitude         : MV.MVSB.MAP.FIELD.FLOAT,
      fLongitude        : MV.MVSB.MAP.FIELD.FLOAT,
      fRadius           : MV.MVSB.MAP.FIELD.FLOAT,
   };
}

MV.MVRP.Class.DGEOPOS = class extends MV.MVMF.Class.BASE
{
   constructor (dLatitude, dLongitude, dRadius)
   {
      super ();

      this.Set (dLatitude, dLongitude, dRadius);
   }

   Set (dLatitude, dLongitude, dRadius)
   {
      this.dLatitude  = dLatitude;
      this.dLongitude = dLongitude;
      this.dRadius    = dRadius;
   }

   static MAP =
   {
      dLatitude         : MV.MVSB.MAP.FIELD.DOUBLE,
      dLongitude        : MV.MVSB.MAP.FIELD.DOUBLE,
      dRadius           : MV.MVSB.MAP.FIELD.DOUBLE,
   };
}

MV.MVRP.Class.FCOORD = class extends MV.MVMF.Class.BASE
{
   static eCOORD =
   {
      CARTESIAN   : 2,
      CYLINDRICAL : 1,
      GEOGRAPHIC  : 0,
   };

   eCOORD = MV.MVRP.Class.FCOORD.eCOORD;

   constructor ()
   {
      super ();

      this.fA     = 0;
      this.fB     = 0;
      this.fC     = 0;
   }

   get fX         () { return this.fA; }
   get fY         () { return this.fB; }
   get fZ         () { return this.fC; }

   get fTheta     () { return this.fA; }

   get fRadius    () { return this.fC; }

   get fLatitude  () { return this.fA; }
   get fLongitude () { return this.fB; }

   Set_Car (fX, fY, fZ)
   {
      this.bCoord = this.eCOORD.CARTESIAN;
      this.fA     = fX;
      this.fB     = fY;
      this.fC     = fZ;
   }

   Set_Cyl (fTheta, fY, fRadius)
   {
      this.bCoord = this.eCOORD.CYLINDRICAL;
      this.fA     = fTheta;
      this.fB     = fY;
      this.fC     = fRadius;
   }

   Set_Geo (fLatitude, fLongitude, fRadius)
   {
      this.bCoord = this.eCOORD.GEOGRAPHIC;
      this.fA     = fLatitude;
      this.fB     = fLongitude;
      this.fC     = fRadius;
   }

   static MAP =
   {
      fA                : MV.MVSB.MAP.FIELD.FLOAT,
      fB                : MV.MVSB.MAP.FIELD.FLOAT,
      fC                : MV.MVSB.MAP.FIELD.FLOAT,
   };
}

MV.MVRP.Class.DCOORD = class extends MV.MVMF.Class.BASE
{
   static eCOORD =
   {
      CARTESIAN   : 2,
      CYLINDRICAL : 1,
      GEOGRAPHIC  : 0,
   };

   eCOORD = MV.MVRP.Class.DCOORD.eCOORD;

   constructor ()
   {
      super ();

      this.bCoord = this.eCOORD.CARTESIAN;
      this.dA     = 0;
      this.dB     = 0;
      this.dC     = 0;
   }

   get dX         () { return this.dA; }
   get dY         () { return this.dB; }
   get dZ         () { return this.dC; }

   get dTheta     () { return this.dA; }

   get dRadius    () { return this.dC; }

   get dLatitude  () { return this.dA; }
   get dLongitude () { return this.dB; }

   Set_Car (dX, dY, dZ)
   {
      this.bCoord = this.eCOORD.CARTESIAN;
      this.dA     = dX;
      this.dB     = dY;
      this.dC     = dZ;
   }

   Set_Cyl (dTheta, dY, dRadius)
   {
      this.bCoord = this.eCOORD.CYLINDRICAL;
      this.dA     = dTheta;
      this.dB     = dY;
      this.dC     = dRadius;
   }

   Set_Geo (dLatitude, dLongitude, dRadius)
   {
      this.bCoord = this.eCOORD.GEOGRAPHIC;
      this.dA     = dLatitude;
      this.dB     = dLongitude;
      this.dC     = dRadius;
   }

   static MAP =
   {
      abReserved_A      : MV.MVSB.MAP.FIELD.PAD (7),
      bCoord            : MV.MVSB.MAP.FIELD.BYTE,
      dA                : MV.MVSB.MAP.FIELD.DOUBLE,
      dB                : MV.MVSB.MAP.FIELD.DOUBLE,
      dC                : MV.MVSB.MAP.FIELD.DOUBLE,
   };
}

MV.MVRP.Class.PARENT = class extends MV.MVMF.Class.BASE
{
   constructor (wClass, twObjectIx)
   {
      super ();

      this.Set (wClass, twObjectIx);
   }

   Set (wClass, twObjectIx)
   {
      this.wClass     = wClass;
      this.twObjectIx = twObjectIx;
   }

   static MAP =
   {
      twObjectIx        : MV.MVSB.MAP.FIELD.TWORD,
      wClass            : MV.MVSB.MAP.FIELD.WORD,
   };
}

MV.MVRP.Class.RELATIVE = class extends MV.MVMF.Class.BASE
{
   constructor (vPosition)
   {
      super ();

      this.vPosition = new MV.MVRP.Class.DOUBLE3 ();

      this.Set (vPosition);
   }

   destructor ()
   {
      this.vPosition = this.vPosition.destructor ();

      return super.destructor ();
   }

   Set (vPosition)
   {
      let o;

      if (o = vPosition) this.vPosition.Set (o.dX, o.dY, o.dZ);
   }

   static MAP =
   {
      vPosition         : MV.MVRP.Class.DOUBLE3.MAP,
   };
}

MV.MVRP.Class.ROTATION = class extends MV.MVMF.Class.BASE
{

   constructor (dwV)
   {
      super ();

      this.Set (dwV);
   }

   Set (dwV)
   {
      this.dwV = dwV;
   }

   static MAP =
   {
      dwV               : MV.MVSB.MAP.FIELD.DWORD
   };
}

MV.MVRP.Class.POSITION_LOCAL = class extends MV.MVMF.Class.BASE
{

   constructor (dwV)
   {
      super ();

      this.Set (dwV);
   }

   Set (dwV)
   {
      this.dwV = dwV;
   }

   static MAP =
   {
      dwV               : MV.MVSB.MAP.FIELD.DWORD
   };
}

MV.MVRP.Class.POSITION_UNIVERSAL = class extends MV.MVMF.Class.BASE
{

   constructor ()
   {
      super ();

      this.pParent      = new MV.MVRP.Class.PARENT   ();
      this.pRelative    = new MV.MVRP.Class.RELATIVE ();
   }

   destructor ()
   {
      this.pParent      = this.pParent  .destructor ();
      this.pRelative    = this.pRelative.destructor ();

      return super.destructor ();
   }

   static MAP =
   {
      pParent           : MV.MVRP.Class.PARENT.MAP,
      pRelative         : MV.MVRP.Class.RELATIVE.MAP,
   };
}

MV.MVRP.Class.RAVATAR_STATE = class extends MV.MVMF.Class.BASE
{

   static MAP =
   {
      bControl                   : MV.MVSB.MAP.FIELD.BYTE,
      bVolume                    : MV.MVSB.MAP.FIELD.BYTE,
      wFlag                      : MV.MVSB.MAP.FIELD.WORD,
      bSerial_A                  : MV.MVSB.MAP.FIELD.BYTE,
      bSerial_B                  : MV.MVSB.MAP.FIELD.BYTE,
      wOrder                     : MV.MVSB.MAP.FIELD.WORD,
      abReserved_A               : MV.MVSB.MAP.FIELD.PAD (7),
      bCoordSys                  : MV.MVSB.MAP.FIELD.BYTE,
      pPosition_Head             : MV.MVRP.Class.POSITION_UNIVERSAL.MAP,
      pRotation_Head             : MV.MVRP.Class.ROTATION.MAP,
      pRotation_Body             : MV.MVRP.Class.ROTATION.MAP,
      pPosition_Hand_Left        : MV.MVRP.Class.POSITION_LOCAL.MAP,
      pRotation_Hand_Left        : MV.MVRP.Class.ROTATION.MAP,
      pPosition_Hand_Right       : MV.MVRP.Class.POSITION_LOCAL.MAP,
      pRotation_Hand_Right       : MV.MVRP.Class.ROTATION.MAP,
      bHand_Left                 : MV.MVSB.MAP.FIELD.BINARY (6),
      bHand_Right                : MV.MVSB.MAP.FIELD.BINARY (6),
      bFace                      : MV.MVSB.MAP.FIELD.BINARY (4),
   };
}

MV.MVRP.Class.RPERSONA_NAME = class extends MV.MVMF.Class.BASE
{
   constructor (wsForename, wsSurname, dwSequence)
   {
      super ();

      this.Set (wsForename, wsSurname, dwSequence);
   }

   Set (wsForename, wsSurname, dwSequence)
   {
      this.wsForename = wsForename;
      this.wsSurname  = wsSurname;
      this.dwSequence = dwSequence;
   }

   static MAP =
   {
      wsForename        : MV.MVSB.MAP.FIELD.STRING_W (19),
      wsSurname         : MV.MVSB.MAP.FIELD.STRING_W (19),
      dwSequence        : MV.MVSB.MAP.FIELD.DWORD,
   };
}

MV.MVRP.Class.RZONE_ROUTE = class extends MV.MVMF.Class.BASE
{
   constructor (dwIPAddress_RHub, dwIPAddress_RProximity)
   {
      super ();

      this.Set (dwIPAddress_RHub, dwIPAddress_RProximity);
   }

   Set (dwIPAddress_RHub, dwIPAddress_RProximity)
   {
      this.dwIPAddress_RHub       = dwIPAddress_RHub;
      this.dwIPAddress_RProximity = dwIPAddress_RProximity;
   }

   static MAP =
   {
      dwIPAddress_RHub        : MV.MVSB.MAP.FIELD.DWORD,
      dwIPAddress_RProximity  : MV.MVSB.MAP.FIELD.DWORD,
   };
}

MV.MVRP.Class.RZONE_POSITION = class extends MV.MVMF.Class.BASE
{
   constructor (pParent, vPosition)
   {
      super ();

      this.pParent   = new MV.MVRP.Class.PARENT  ();
      this.vPosition = new MV.MVRP.Class.DOUBLE3 ();

      this.Set (pParent, vPosition);
   }

   destructor ()
   {
      this.pParent   = this.pParent  .destructor ();
      this.vPosition = this.vPosition.destructor ();

      return super.destructor ();
   }

   Set (pParent, vPosition)
   {
      let o;

      if (o = pParent  ) this.pParent  .Set (o.wClass, o.twObjectIx);
      if (o = vPosition) this.vPosition.Set (o.dX, o.dY, o.dZ);
   }

   static MAP =
   {
      pParent           : MV.MVRP.Class.PARENT .MAP,
      vPosition         : MV.MVRP.Class.DOUBLE3.MAP,
   };
}

MV.MVXP.SB_USERROOT.apAction['RPERSONA_OPEN_SUBMIT'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (16 | ((39) << 16)),
   new MV.MVSB.MAP
   ({
      twUserRootIx               : MV.MVSB.MAP.FIELD.TWORD8,
      abReserved_X               : MV.MVSB.MAP.FIELD.PAD (16),
      sContact                   : MV.MVSB.MAP.FIELD.STRING (64),
      pBirthdate                 : MV.MVXP.Class.USER_BIRTHDATE.MAP,
      bTerms                     : MV.MVSB.MAP.FIELD.BYTE,
      bTest                      : MV.MVSB.MAP.FIELD.BYTE,
      abReserved_A               : MV.MVSB.MAP.FIELD.PAD (26),
      pName                      : MV.MVRP.Class.RPERSONA_NAME.MAP,
      abReserved_B               : MV.MVSB.MAP.FIELD.PAD (8),
   }),
   new MV.MVSB.MAP
   ({
      dwError_Email              : MV.MVSB.MAP.FIELD.DWORD,
      dwError_SMS                : MV.MVSB.MAP.FIELD.DWORD,
      dwResult_User              : MV.MVSB.MAP.FIELD.DWORD,
      dwResult_RPersona          : MV.MVSB.MAP.FIELD.DWORD,
      sContact                   : MV.MVSB.MAP.FIELD.STRING (64),
      twRegionIx             : MV.MVSB.MAP.FIELD.TWORD8,
      twSecureDoorIx             : MV.MVSB.MAP.FIELD.TWORD8,
   }),
   true,
   function (pResponse, dwResult) { return dwResult ? dwResult : pResponse.dwResult_User | pResponse.dwResult_RPersona; }
);

MV.MVXP.SB_USERROOT.apAction['RPERSONA_OPEN_CONFIRM'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (17 | ((39) << 16)),
   new MV.MVSB.MAP
   ({
      twUserRootIx               : MV.MVSB.MAP.FIELD.TWORD8,
      abReserved_X               : MV.MVSB.MAP.FIELD.PAD (16),
      twSecureDoorIx             : MV.MVSB.MAP.FIELD.TWORD8,
      abReserved_A               : MV.MVSB.MAP.FIELD.PAD (4),
      dwCode                     : MV.MVSB.MAP.FIELD.DWORD,
      sPassword                  : MV.MVSB.MAP.FIELD.STRING_W (32),
      abReserved_B               : MV.MVSB.MAP.FIELD.PAD (8),
   }),
   MV.MVXP.SB_APPLIC.Map_Token_Out,
   true,
   MV.MVXP.SB_APPLIC.Response_Eval
);

MV.MVRP.SB_RROOT = class extends MV.MVSB.SB_OBJECT
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVSB',
         'RRoot',

         52,

         MV.MVRP.SB_RROOT.apAction,

         true,

         new MV.MVSB.MAP
         ({
            bPaused        : MV.MVSB.MAP.FIELD.BYTE,
            abReserved_A   : MV.MVSB.MAP.FIELD.PAD (15),

                             wSize_Partial: [MV.MVSB.MAP.FIELD.eTYPE.SIZE, 0, "Partial"],
         })
      );
   }

}

MV.MVRP.SB_RROOT.FACTORY = class extends MV.MVSB.SB_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVRP.SB_RROOT (this.pReference, this.pMap, pClient);
   }
}

MV.MVRP.SB_RROOT.apAction =
{
   RZONE_OPEN_NEW :  new MV.MVSB.SERVICE.CLIENT.ACTION
                     (
                        (3 | ((52) << 16)),
                        new MV.MVSB.MAP
                        ({
                           twRRootIx               : MV.MVSB.MAP.FIELD.TWORD8,
                           abReserved_A            : MV.MVSB.MAP.FIELD.PAD (8),
                           pRoute                  : MV.MVRP.Class.RZONE_ROUTE.MAP,
                           pPosition               : MV.MVRP.Class.RZONE_POSITION.MAP,
                           pCoord                  : MV.MVRP.Class.DCOORD.MAP,
                        }),
                        new MV.MVSB.MAP
                        ({
                           twRZoneIx               : MV.MVSB.MAP.FIELD.TWORD8,
                        })
                     ),
   RZONE_OPEN   :    new MV.MVSB.SERVICE.CLIENT.ACTION
                     (
                        (3 | ((52) << 16)),
                        new MV.MVSB.MAP
                        ({
                           twRRootIx               : MV.MVSB.MAP.FIELD.TWORD8,
                           abReserved_A            : MV.MVSB.MAP.FIELD.PAD (8),
                           pRoute                  : MV.MVRP.Class.RZONE_ROUTE.MAP,
                           pPosition               : MV.MVRP.Class.RZONE_POSITION.MAP,
                           pGeoPos                 : MV.MVRP.Class.DGEOPOS.MAP,
                        }),
                        new MV.MVSB.MAP
                        ({
                           twRZoneIx               : MV.MVSB.MAP.FIELD.TWORD8,
                        })
                     ),
   RZONE_CLOSE  :    new MV.MVSB.SERVICE.CLIENT.ACTION
                     (
                        (4 | ((52) << 16)),
                        new MV.MVSB.MAP
                        ({
                           twRRootIx               : MV.MVSB.MAP.FIELD.TWORD8,
                           twRZoneIx               : MV.MVSB.MAP.FIELD.TWORD8,
                        })
                     ),
};

MV.MVRP.SB_RUSER = class extends MV.MVSB.SB_OBJECT
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVSB',
         'RUser',

         50,

         MV.MVRP.SB_RUSER.apAction,

         true,

         new MV.MVSB.MAP
         ({
            abReserved_A          : MV.MVSB.MAP.FIELD.PAD (3),
            bGuest                : MV.MVSB.MAP.FIELD.BYTE,

            wCount_RPersona       : MV.MVSB.MAP.FIELD.WORD,
            abReserved_B          : MV.MVSB.MAP.FIELD.PAD (2),

            twRPersonaIx_Default  : MV.MVSB.MAP.FIELD.TWORD8,

                                    wSize_Partial: [MV.MVSB.MAP.FIELD.eTYPE.SIZE, 0, "Partial"],

            twRPersonaIx_Active   : MV.MVSB.MAP.FIELD.TWORD8,
            twSessionIz           : MV.MVSB.MAP.FIELD.TWORD8,
            tmAbandoned           : MV.MVSB.MAP.FIELD.TIME
         })
      );
   }

}

MV.MVRP.SB_RUSER.FACTORY = class extends MV.MVSB.SB_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVRP.SB_RUSER (this.pReference, this.pMap, pClient);
   }
}

MV.MVRP.SB_RUSER.apAction =
{
   RPERSONA_OPEN     : new MV.MVSB.SERVICE.CLIENT.ACTION
                       (
                          (1 | ((50) << 16)),
                          new MV.MVSB.MAP
                          ({
                             twRUserIx                      : MV.MVSB.MAP.FIELD.TWORD8,
                             abReserved_X                   : MV.MVSB.MAP.FIELD.PAD (16),
                             twSecureDoorIx                 : MV.MVSB.MAP.FIELD.TWORD8,
                             abReserved_A                   : MV.MVSB.MAP.FIELD.PAD (16),
                             pName                          : MV.MVRP.Class.RPERSONA_NAME.MAP,
                             qwMapIx_Home                   : MV.MVSB.MAP.FIELD.QWORD,
                             pPosition                      : MV.MVRP.Class.POSITION_UNIVERSAL.MAP,
                          }),
                          new MV.MVSB.MAP
                          ({
                             twRPersonaIx                   : MV.MVSB.MAP.FIELD.TWORD8
                          })
                       ),

   RPERSONA_CLOSE    : new MV.MVSB.SERVICE.CLIENT.ACTION
                       (
                          (2 | ((50) << 16)),
                          new MV.MVSB.MAP
                          ({
                             twRUserIx                      : MV.MVSB.MAP.FIELD.TWORD8,
                             twRPersonaIx                   : MV.MVSB.MAP.FIELD.TWORD8
                          }),
                          new MV.MVSB.MAP
                          ({
                          })
                       ),

   RPERSONA_ENTER    : new MV.MVSB.SERVICE.CLIENT.ACTION
                       (
                          (3 | ((50) << 16)),
                          new MV.MVSB.MAP
                          ({
                             twRUserIx                      : MV.MVSB.MAP.FIELD.TWORD8,
                             twRPersonaIx                   : MV.MVSB.MAP.FIELD.TWORD8,
                             twSessionIz                    : MV.MVSB.MAP.FIELD.TWORD8,
                             pPosition                      : MV.MVRP.Class.POSITION_UNIVERSAL.MAP,
                          }),
                          new MV.MVSB.MAP
                          ({
                          })
                       ),

   RPERSONA_LEAVE    : new MV.MVSB.SERVICE.CLIENT.ACTION
                       (
                          (4 | ((50) << 16)),
                          new MV.MVSB.MAP
                          ({
                             twRUserIx                      : MV.MVSB.MAP.FIELD.TWORD8,
                             twRPersonaIx                   : MV.MVSB.MAP.FIELD.TWORD8,
                             twSessionIz                    : MV.MVSB.MAP.FIELD.TWORD8
                          }),
                          new MV.MVSB.MAP
                          ({
                          })
                       ),

   RPERSONA_ABANDON  : new MV.MVSB.SERVICE.CLIENT.ACTION
                       (
                          (5 | ((50) << 16)),
                          new MV.MVSB.MAP
                          ({
                             twRUserIx                      : MV.MVSB.MAP.FIELD.TWORD8,
                             twRPersonaIx                   : MV.MVSB.MAP.FIELD.TWORD8,
                             twSessionIz                    : MV.MVSB.MAP.FIELD.TWORD8
                          }),
                          new MV.MVSB.MAP
                          ({
                          })
                       ),

   RPERSONA_ASSUME   : new MV.MVSB.SERVICE.CLIENT.ACTION
                       (
                          (6 | ((50) << 16)),
                          new MV.MVSB.MAP
                          ({
                             twRUserIx                      : MV.MVSB.MAP.FIELD.TWORD8,
                             twRPersonaIx                   : MV.MVSB.MAP.FIELD.TWORD8,
                             twSessionIz                    : MV.MVSB.MAP.FIELD.TWORD8
                          }),
                          new MV.MVSB.MAP
                          ({
                             pState                         : MV.MVRP.Class.RAVATAR_STATE.MAP,
                          })
                       ),
};

MV.MVRP.SB_RPERSONA = class extends MV.MVSB.SB_OBJECT
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVSB',
         'RPersona',

         51,

         MV.MVRP.SB_RPERSONA.apAction,

         true,

         new MV.MVSB.MAP
         ({
            abReserved_A : MV.MVSB.MAP.FIELD.PAD (4),
            bSerial_A    : MV.MVSB.MAP.FIELD.BYTE,
            bSerial_B    : MV.MVSB.MAP.FIELD.BYTE,
            bPaused      : MV.MVSB.MAP.FIELD.BYTE,
            bGuest       : MV.MVSB.MAP.FIELD.BYTE,
            pName        : MV.MVRP.Class.RPERSONA_NAME.MAP,
            twRZoneIx    : MV.MVSB.MAP.FIELD.TWORD8,

                           wSize_Partial: [MV.MVSB.MAP.FIELD.eTYPE.SIZE, 0, "Partial"],

            qwMapIx_Home : MV.MVSB.MAP.FIELD.QWORD,
            pPosition    : MV.MVRP.Class.POSITION_UNIVERSAL.MAP,
            abReserved_C : MV.MVSB.MAP.FIELD.PAD (8)
         })
      );
   }

}

MV.MVRP.SB_RPERSONA.FACTORY = class extends MV.MVSB.SB_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVRP.SB_RPERSONA (this.pReference, this.pMap, pClient);
   }
}

MV.MVRP.SB_RPERSONA.apAction = {};

MV.MVRP.SB_RPERSONA.apAction['NAME'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (3 | ((51) << 16)),
   new MV.MVSB.MAP
   ({
      twRPersonaIx                         : MV.MVSB.MAP.FIELD.TWORD8,
      pName                                : MV.MVRP.Class.RPERSONA_NAME.MAP,
   })
);

MV.MVRP.SB_RPERSONA.apAction['UPDATE'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (5 | ((51) << 16)),
   new MV.MVSB.MAP
   ({
      twRPersonaIx                  : MV.MVSB.MAP.FIELD.TWORD8,
      tmStamp                       : MV.MVSB.MAP.FIELD.TIME,
      pState                        : MV.MVRP.Class.RAVATAR_STATE.MAP,
      abReserved_A                  : MV.MVSB.MAP.FIELD.PAD (2),
      wSamples                      : MV.MVSB.MAP.FIELD.WORD,
      wCodec                        : MV.MVSB.MAP.FIELD.WORD,
      wSize                         : MV.MVSB.MAP.FIELD.WORD,

                                      wSize_VarSize: [MV.MVSB.MAP.FIELD.eTYPE.SIZE, 0, "VarSize"],

      abData                        : [ MV.MVSB.MAP.FIELD.BYTE, 375 * 2, 'wSize' ],
   }),
   null,
   false
);

MV.MVRP.SB_RPERSONA.apAction['UPDATE_AUDIO'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (6 | ((51) << 16)),
   new MV.MVSB.MAP
   ({
      twRPersonaIx                      : MV.MVSB.MAP.FIELD.TWORD8,
      wDistance_Piv                     : MV.MVSB.MAP.FIELD.WORD,
      wAmp_Close                        : MV.MVSB.MAP.FIELD.WORD,
      wAmp_Far                          : MV.MVSB.MAP.FIELD.WORD,
      wAvg_Volume                       : MV.MVSB.MAP.FIELD.WORD,
      wAmp_Min                          : MV.MVSB.MAP.FIELD.WORD,
      wAmp_LR_Gain                      : MV.MVSB.MAP.FIELD.WORD,
      wAmp_LR_Drop                      : MV.MVSB.MAP.FIELD.WORD,
      wAngle_Focus                      : MV.MVSB.MAP.FIELD.WORD,
      sAmp_Focus                        : MV.MVSB.MAP.FIELD.SHORT,
      abReserved_A                      : MV.MVSB.MAP.FIELD.PAD (6)
   })
);

MV.MVRP.SB_RPERSONA.apAction['UPDATE_LEVEL'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (8 | ((51) << 16)),
   new MV.MVSB.MAP
   ({
      twRPersonaIx                      : MV.MVSB.MAP.FIELD.TWORD8,
      bLevel                            : MV.MVSB.MAP.FIELD.BYTE,
      abReserved_A                      : MV.MVSB.MAP.FIELD.PAD (7)
   })
);

MV.MVRP.SB_RPERSONA.apAction['UPDATE_VISIO'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (7 | ((51) << 16)),
   new MV.MVSB.MAP
   ({
      twRPersonaIx                      : MV.MVSB.MAP.FIELD.TWORD8,
      aSBA_RPersona_Update_Visio_Ex     :
      [
         {
            wCount                      : MV.MVSB.MAP.FIELD.WORD,
            wMod_Update                 : MV.MVSB.MAP.FIELD.WORD,
            wDistance                   : MV.MVSB.MAP.FIELD.WORD,
         },
         8
      ]
   })
);

MV.MVRP.SB_RPERSONA.apAction['FIND'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (10 | ((51) << 16)),
   new MV.MVSB.MAP
   ({
      twRPersonaIx                      : MV.MVSB.MAP.FIELD.TWORD8,
      twRPersonaIx_Find                 : MV.MVSB.MAP.FIELD.TWORD8,
   }),
   new MV.MVSB.MAP
   ({
      pState                            : MV.MVRP.Class.RAVATAR_STATE.MAP,
   })
);

MV.MVRP.SB_RPERSONA.apAction['MUTE'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (12 | ((51) << 16)),
   new MV.MVSB.MAP
   ({
      twRPersonaIx                      : MV.MVSB.MAP.FIELD.TWORD8,
      twRPersonaIx_Mute                 : MV.MVSB.MAP.FIELD.TWORD8,
   })
);

MV.MVRP.SB_RZONE = class extends MV.MVSB.SB_OBJECT
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVSB',
         'RZone',

         53,

         MV.MVRP.SB_RZONE.apAction,

         true,

         new MV.MVSB.MAP
         ({
            pRoute                     : MV.MVRP.Class.RZONE_ROUTE.MAP,
            pPosition                  : MV.MVRP.Class.RZONE_POSITION.MAP,
            abReserved_X               : MV.MVSB.MAP.FIELD.PAD (8),
            wCount_RPersona            : MV.MVSB.MAP.FIELD.WORD,
            abReserved_A               : MV.MVSB.MAP.FIELD.PAD (2),
            bCount_Nearest             : MV.MVSB.MAP.FIELD.BYTE,
            abReserved_B               : MV.MVSB.MAP.FIELD.PAD (3),

            atwRZoneIx                 : MV.MVSB.MAP.FIELD.PAD (64),
         })
      );
   }

}

MV.MVRP.SB_RZONE.FACTORY = class extends MV.MVSB.SB_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVRP.SB_RZONE (this.pReference, this.pMap, pClient);
   }
}

MV.MVRP.SB_RZONE.apAction =
{
   PAUSE         :  new MV.MVSB.SERVICE.CLIENT.ACTION
                    (
                       (1 | ((53) << 16)),
                       new MV.MVSB.MAP
                       ({
                          twRZoneIx            : MV.MVSB.MAP.FIELD.TWORD8,
                       })
                    ),

   CONTINUE      :  new MV.MVSB.SERVICE.CLIENT.ACTION
                    (
                       (2 | ((53) << 16)),
                       new MV.MVSB.MAP
                       ({
                          twRZoneIx            : MV.MVSB.MAP.FIELD.TWORD8,
                       })
                    ),

   ASSIGN        :  new MV.MVSB.SERVICE.CLIENT.ACTION
                    (
                       (3 | ((53) << 16)),
                       new MV.MVSB.MAP
                       ({
                          twRZoneIx            : MV.MVSB.MAP.FIELD.TWORD8,
                          pRoute               : MV.MVRP.Class.RZONE_ROUTE.MAP,
                       })
                    ),

   MOVE          :  new MV.MVSB.SERVICE.CLIENT.ACTION
                    (
                       (4 | ((53) << 16)),
                       new MV.MVSB.MAP
                       ({
                          twRZoneIx            : MV.MVSB.MAP.FIELD.TWORD8,
                          pPosition            : MV.MVRP.Class.RZONE_POSITION.MAP,
                          pCoord               : MV.MVRP.Class.DCOORD.MAP,
                       })
                    ),

   NEAREST_OPEN  :  new MV.MVSB.SERVICE.CLIENT.ACTION
                    (
                       (6 | ((53) << 16)),
                       new MV.MVSB.MAP
                       ({
                          twRZoneIx            : MV.MVSB.MAP.FIELD.TWORD8,
                          twRZoneIx_Nearest    : MV.MVSB.MAP.FIELD.TWORD8,
                       })
                    ),

   NEAREST_CLOSE :  new MV.MVSB.SERVICE.CLIENT.ACTION
                    (
                       (7 | ((53) << 16)),
                       new MV.MVSB.MAP
                       ({
                          twRZoneIx            : MV.MVSB.MAP.FIELD.TWORD8,
                          twRZoneIx_Nearest    : MV.MVSB.MAP.FIELD.TWORD8,
                       })
                    ),
};

MV.MVRP.RROOT = class extends MV.MVMF.MODEL_OBJECT
{
   static factory ()
   {
      return new this.FACTORY ('RRoot');
   }

   constructor (pReference, pSource)
   {
      super (pReference, pSource);

      this.twRRootIx = pReference.twObjectIx;
   }

   Request (sAction)
   {
      let pIAction = super.Request (sAction);
      if (pIAction)
      {
         let pRequest = pIAction.pRequest;

         if ('twRRootIx' in pRequest)
            pRequest.twRRootIx = this.twRRootIx;
      }

      return pIAction;
   }
}

MV.MVRP.RROOT.FACTORY = class extends MV.MVMF.MODEL_OBJECT.FACTORY
{

   Reference (asArgs)
   {
      let twRRootIx = Number (asArgs[0]);

      return new MV.MVRP.RROOT.IREFERENCE (this.sID, twRRootIx);
   }
}

MV.MVRP.RROOT.IREFERENCE = class extends MV.MVMF.MODEL_OBJECT.IREFERENCE
{

   Create (pSource)
   {
      return new MV.MVRP.RROOT (this, pSource);
   }
}

MV.MVRP.RUSER = class extends MV.MVMF.MODEL_OBJECT
{
   static factory ()
   {
      return new this.FACTORY ('RUser');
   }

   constructor (pReference, pSource)
   {
      super (pReference, pSource);

      this.twRUserIx = pReference.twObjectIx;
   }

   Request (sAction)
   {
      let pIAction = super.Request (sAction);
      if (pIAction)
      {
         let pRequest = pIAction.pRequest;

         if ('twRUserIx' in pRequest)
            pRequest.twRUserIx = this.twRUserIx;
      }

      return pIAction;
   }
}

MV.MVRP.RUSER.FACTORY = class extends MV.MVMF.MODEL_OBJECT.FACTORY
{

   Reference (asArgs)
   {
      let twRUserIx = Number (asArgs[0]);

      return new MV.MVRP.RUSER.IREFERENCE (this.sID, twRUserIx);
   }
}

MV.MVRP.RUSER.IREFERENCE = class extends MV.MVMF.MODEL_OBJECT.IREFERENCE
{

   Create (pSource)
   {
      return new MV.MVRP.RUSER (this, pSource);
   }
}

MV.MVRP.RPERSONA = class extends MV.MVMF.MODEL_OBJECT
{
   static factory ()
   {
      return new this.FACTORY ('RPersona');
   }

   constructor (pReference, pSource)
   {
      super (pReference, pSource);

      this.twRPersonaIx = pReference.twObjectIx;

      this.pName     = new MV.MVRP.Class.RPERSONA_NAME      ();
      this.pPosition = new MV.MVRP.Class.POSITION_UNIVERSAL ();
   }

   destructor ()
   {
      this.pName     = this.pName    .destructor ();
      this.pPosition = this.pPosition.destructor ();

      return super.destructor ();
   }

   Request (sAction)
   {
      let pIAction = super.Request (sAction);
      if (pIAction)
      {
         let pRequest = pIAction.pRequest;

         if ('twRPersonaIx' in pRequest)
            pRequest.twRPersonaIx = this.twRPersonaIx;
      }

      return pIAction;
   }

   Vect_Encode (v)
   {
      let nX = 512 + Math.round (v[0] * 400);
      let nY = 512 + Math.round (v[1] * 400);
      let nZ = 512 + Math.round (v[2] * 400);

      return ((((nZ << 10) + nY) << 10) + nX);
   }

   Vect_Decode (dwV, v)
   {
      v[0] = ((dwV & 0x000003FF) - 512) / 400;
      dwV = dwV >> 10;
      v[1] = ((dwV & 0x000003FF) - 512) / 400;
      dwV = dwV >> 10;
      v[2] = ((dwV & 0x000003FF) - 512) / 400;
   }

   Quat_Encode (q)
   {
      let dwX, dwY, dwZ, dwW;

      dwW = q[3] < 0 ? 0x80000000 : 0;
      dwX = 512 + Math.round (q[0] * 511);
      dwY = 512 + Math.round (q[1] * 511);
      dwZ = 512 + Math.round (q[2] * 511);

      return (((dwZ * 1024) + dwY) * 1024) + dwX + dwW;
   }

   Quat_Decode (dwV, q)
   {
      q[0] = ((dwV & 0x000003FF) - 512) / 511;
      dwV  = dwV >> 10;
      q[1] = ((dwV & 0x000003FF) - 512) / 511;
      dwV  = dwV >> 10;
      q[2] = ((dwV & 0x000003FF) - 512) / 511;
      dwV  = dwV >> 10;
      q[3] = (dwV & 0x00000002) ? -1 : 1;

      dwV    = q[0] * q[0] + q[1] * q[1] + q[2] * q[2];
      q[3] *= (dwV < 1) ? Math.sqrt (1 - dwV) : 0;
   }
}

MV.MVRP.RPERSONA.FACTORY = class extends MV.MVMF.MODEL_OBJECT.FACTORY
{

   Reference (asArgs)
   {
      let twRPersonaIx = Number (asArgs[0]);

      return new MV.MVRP.RPERSONA.IREFERENCE (this.sID, twRPersonaIx);
   }
}

MV.MVRP.RPERSONA.IREFERENCE = class extends MV.MVMF.MODEL_OBJECT.IREFERENCE
{

   Create (pSource)
   {
      return new MV.MVRP.RPERSONA (this, pSource);
   }
}

MV.MVRP.RZONE = class extends MV.MVMF.MODEL_OBJECT
{
   static factory ()
   {
      return new this.FACTORY ('RZone');
   }

   constructor (pReference, pSource)
   {
      super (pReference, pSource);

      this.twRZoneIx = pReference.twObjectIx;

      this.pRoute    = new MV.MVRP.Class.RZONE_ROUTE    ();
      this.pPosition = new MV.MVRP.Class.RZONE_POSITION ();
   }

   destructor ()
   {
      this.pRoute    = this.pRoute   .destructor ();
      this.pPosition = this.pPosition.destructor ();

      return super.destructor ();
   }

   Request (sAction)
   {
      let pIAction = super.Request (sAction);
      if (pIAction)
      {
         let pRequest = pIAction.pRequest;

         if ('twRZoneIx' in pRequest)
            pRequest.twRZoneIx = this.twRZoneIx;
      }

      return pIAction;
   }
}

MV.MVRP.RZONE.FACTORY = class extends MV.MVMF.MODEL_OBJECT.FACTORY
{

   Reference (asArgs)
   {
      let twRZoneIx = Number (asArgs[0]);

      return new MV.MVRP.RZONE.IREFERENCE (this.sID, twRZoneIx);
   }
}

MV.MVRP.RZONE.IREFERENCE = class extends MV.MVMF.MODEL_OBJECT.IREFERENCE
{

   Create (pSource)
   {
      return new MV.MVRP.RZONE (this, pSource);
   }
}

MV.MVRP.Audio = class
{
   MICROSECONDSPERSECOND      = 1000000;
   MICROSECONDSPERMILLISECOND = 1000;

   STAT_AUDIO                 = 0;
   STAT_AUDIO_AMP             = 1;
   STAT_AUDIO_SAMPLES         = 2;
   STAT_INPUT                 = 3;
   STAT_INPUT_AMP             = 4;
   STAT_INPUT_SAMPLES         = 5;
   STAT_OUTPUT                = 6;
   STAT_OUTPUT_DELTA          = 7;
   STAT_OUTPUT_DELAY          = 8;
   STAT_COUNT                 = 9;

   constructor (nSampleRate, nSliceRate, nSlices, Proximity)
   {
      this.m_nSampleRate      = nSampleRate;
      this.m_nSliceRate       = nSliceRate;
      this.m_nSlices          = nSlices;

      this.m_nSamples_Slice   = this.m_nSampleRate / this.m_nSliceRate;

      this.m_nBytes_Sample    = 2;
      this.m_nBytes_Slice     = this.m_nSamples_Slice * this.m_nBytes_Sample;

      this.m_bMute            = false;
      this.m_bDeaf            = false;
      this.m_sLevel_Echo      = 0.1;
      this.m_sLevel_Supress   = 0.05;

      this.m_pContext         = null;
      this.m_pMedia           = null;
      this.m_nSequence        = 0;

      this.m_pNode_Microphone = null;
      this.m_pNode_Processor  = null;

      this.m_Proximity        = Proximity;
   }

   destructor ()
   {
      this.Stop ();

      return null;
   }

   Init ()
   {
      this.m_Buffer         = {
                                 pArrayBuffer  : null,
                                 asSample      : null,
                                 nSize         : 2048,
                                 nBytes        : this.m_nBytes_Slice   * this.m_nSlices,
                                 nCount        : this.m_nSamples_Slice * this.m_nSlices,
                                 nLength       : 0,
                                 nHead         : 0,
                                 nTail         : 0,
                                 nSlice        : 0,
                              };

      this.m_Convert        = {
                                 nSample       : 0,
                                 nOffset       : 0,
                                 nBoundary     : 0,
                                 fSample       : 0,
                              };

      this.m_Input          = {
                                 nCapture      : 0,
                                 bAudio        : false,
                                 tmHead        : 0,

   asLevel : [],
   nCount  : 64,
                              };

      this.m_Output         = {
                                 tmServer_Base : 0,
                                 nDelay        : 1,
                                 asLevel       : [],
                                 nCount        : 64,
                                 nSlice        : 0,
                              };

      this.m_tmServer_Stat  = 0;
      this.m_aStat          = [];

      for (var n=0; n<this.STAT_COUNT; n++)
         this.m_aStat.push (new MV.MVRP.Audio.STAT (this));

      this.m_aStat[this.STAT_AUDIO_SAMPLES].nGroup = 5;
      this.m_aStat[this.STAT_INPUT_SAMPLES].nGroup = 5;
      this.m_aStat[this.STAT_OUTPUT_DELTA ].nGroup = 3;
      this.m_aStat[this.STAT_OUTPUT_DELAY ].nGroup = 3;

      this.MICROSECONDSPERSLICE = this.MICROSECONDSPERSECOND / this.m_nSliceRate;
   }

   Time (tmServer)
   {
      if (tmServer)
      {
         let nMod, nGroup, nStat, n;

         for (nGroup=0, nMod=64; nMod>0; nMod*=2)
            if (tmServer - (tmServer % nMod) != this.m_tmServer_Stat - (this.m_tmServer_Stat % nMod))
               nGroup++;
            else nMod = 0;

         if (nGroup > 0)
         {
            for (nStat=0; nStat<this.m_aStat.length; nStat++)
            {
               let Stat = this.m_aStat[nStat];

               if (Stat.nGroup <= nGroup)
               {
                  for (n=Stat.anValue.length-1; n>0; n--)
                     Stat.anValue[n] = Stat.anValue[n-1];
                  Stat.anValue[n] = 0;
               }
            }
         }

         this.m_tmServer_Stat = tmServer;
      }

      return this.m_tmServer_Stat;
   }

   Encode =
   {
      0: function (abData, wSamples, asSample)
         {

            return wSamples * 2;
         },

      1: function (abData, wSamples, asSample)
         {

            let sSample, nDelta, nSign;
            let u, v = 2;

            sSample = asSample[0];

            for (u=1; u<wSamples; u++)
            {
               nDelta = asSample[u] - sSample;

               if (nDelta < 0)
               {
                  nDelta = -nDelta;
                  nSign  = -1;
               }
               else nSign = 0;

               if (nDelta > 32767 + 672)
                  nDelta = 32767 + 672;

               if (nDelta < 32)
               {
                  abData[v++] = ((nSign & 0x80) | (nDelta << 2) | 0);
               }
               else if (nDelta < 160)
               {
                  nDelta = (nDelta - 32) >> 2;

                  abData[v++] = ((nSign & 0x80) | (nDelta << 2) | 1);

                  nDelta = (nDelta << 2) + 32;
               }
               else if (nDelta < 672)
               {
                  nDelta = (nDelta - 160) >> 4;

                  abData[v++] = ((nSign & 0x80) | (nDelta << 2) | 2);

                  nDelta = (nDelta << 4) + 160;
               }
               else
               {
                  nDelta = (nDelta - 672) >> 2;

                  let x = ((nSign & 0x8000) | (nDelta << 2) | 3);
                  abData[v++] = x & 0xFF;
                  abData[v++] = x >> 8;

                  nDelta = (nDelta << 2) + 672;
               }

               if (nSign == 0)
                  sSample += nDelta;
               else sSample -= nDelta;
            }

            return v;
         }

   };

   Decode =
   {
      0: function (ChannelData, wSamples, ByteStream)
         {
            let wSample;

            for (wSample=0; wSample<wSamples; wSample++)
            {
               ChannelData[wSample] = ((ByteStream.Read_SHORT () + 32768) / 32768) - 1;

            }

            return wSamples * 2;
         },

      1: function (ChannelData, wSamples, ByteStream)
         {
            let wSample = 0;
            let sSample = ByteStream.Read_SHORT ();

            ChannelData[wSample++] = ((sSample + 32768) / 32768) - 1;

            let abBuffer = new Uint8Array (ByteStream.buffer.buffer, ByteStream.offset);
            let u = 0;

            while (wSample < wSamples)
            {
               let nDeltaLo = abBuffer[u++];
               let nDeltaHi, nDelta, nSign;

               switch (nDeltaLo & 0x03)
               {
                  case 0: nSign    = (nDeltaLo & 0x80);
                          nDelta   = ((nDeltaLo & 0x7C) >> 2);
                          break;

                  case 1: nSign    = (nDeltaLo & 0x80);
                          nDelta   = ((nDeltaLo & 0x7C) >> 0) + 32;
                          break;

                  case 2: nSign    = (nDeltaLo & 0x80);
                          nDelta   = ((nDeltaLo & 0x7C) << 2) + 160;
                          break;

                  case 3: nDeltaHi = abBuffer[u++];
                          nSign    = (nDeltaHi & 0x80);
                          nDelta   = (nDeltaLo & 0xFC) + ((nDeltaHi & 0x7F) << 8) + 672;
                          break;
               }

               if (nSign == 0)
                  sSample += nDelta;
               else sSample -= nDelta;

               ChannelData[wSample++] = ((sSample + 32768) / 32768) - 1;
            }

            ByteStream.Seek (u);

            return 2 + u;
         }
   };

   SkipSlice ()
   {
      this.m_Buffer.nSlice  += 1;
      this.m_Buffer.nHead   += this.m_nSamples_Slice;
      this.m_Buffer.nLength -= this.m_nSamples_Slice;

      if (this.m_Buffer.nLength < 0)
      {
         this.m_Buffer.nTail   = this.m_Buffer.nHead;
         this.m_Buffer.nLength = 0;
      }

      if (this.m_Input.tmHead)
         this.m_Input.tmHead++;
   }

   Start (bCapture)
   {

      if (this.m_pContext == null)
      {
         this.Init ();

         this.m_pContext = new AudioContext ();

         this.m_Buffer.pArrayBuffer = new ArrayBuffer (this.m_Buffer.nBytes);
         this.m_Buffer.asSample     = new Int16Array  (this.m_Buffer.pArrayBuffer);

         if (bCapture)
            this.Capture ();
      }
   }

   Stop ()
   {
      if (this.m_pContext != null)
      {
         this.Release ();

         this.m_Buffer.pArrayBuffer = null;
         this.m_Buffer.asSample     = null;

         this.m_pContext.close ();
         this.m_pContext = null;
      }
   }

   Capture ()
   {
      if (this.m_pMedia == null)
      {

         this.m_Input.nCapture      = this.m_pContext.currentTime;
         this.m_Input.bAudio        = false;

         this.m_nSequence++;

         this.m_pMedia = navigator.mediaDevices.getUserMedia ({ audio: true, video: false });

         this.m_pMedia['then' ] (this.onStream.bind (this, this.m_nSequence));
         this.m_pMedia['catch'] (this.onError .bind (this, this.m_nSequence));
      }
   }

   Release ()
   {
      if (this.m_pMedia != null)
      {
         if (this.m_pNode_Processor)
         {
            this.m_pNode_Processor.disconnect ();
            this.m_pNode_Processor.onaudioprocess = null;
            this.m_pNode_Processor  = null;
         }

         if (this.m_pNode_Microphone)
         {
            this.m_pNode_Microphone.disconnect ();
            this.m_pNode_Microphone = null;
         }

         this.m_pMedia = null;

         this.m_nSequence++;
      }
   }

   Mute (bMute)
   {
      if (bMute !== undefined)
      {
         this.m_bMute = bMute === null ? this.m_bMute == false : bMute != false;

         this.m_Proximity.Emit ('onMute', this.m_bMute);
      }

      return this.m_bMute;
   }

   Deaf (bDeaf)
   {
      if (bDeaf !== undefined)
      {
         this.m_bDeaf = bDeaf === null ? this.m_bDeaf == false : bDeaf != false;

         this.m_Proximity.Emit ('onDeaf', this.m_bDeaf);
      }

      return this.m_bDeaf;
   }

   Echo (sLevel)
   {
      if (sLevel !== undefined)
      {
         if (sLevel >= 0  &&  sLevel <= 1)
            this.m_sLevel_Echo = sLevel;
      }

      return this.m_sLevel_Echo;
   }

   Supress (sLevel)
   {
      if (sLevel !== undefined)
      {
         if (sLevel > 0  &&  sLevel <= 1)
            this.m_sLevel_Supress = sLevel;
      }

      return this.m_sLevel_Supress;
   }

   onError (nSequence, e)
   {
      if (nSequence == this.m_nSequence)
      {
         this.m_Proximity.Emit ('onError', 'getUserMediaFailed');
         console.log ('Unable to get user media!');
      }
   }

   onStream (nSequence, stream)
   {
      if (nSequence == this.m_nSequence)
      {
         this.m_pNode_Microphone = this.m_pContext.createMediaStreamSource (stream);
         this.m_pNode_Processor  = this.m_pContext.createScriptProcessor (this.m_Buffer.nSize, 1, 1);

         this.m_pNode_Processor.onaudioprocess = this.onAudioProcess.bind (this);

         this.m_pNode_Microphone.connect (this.m_pNode_Processor);
         this.m_pNode_Processor .connect (this.m_pContext.destination);
      }
   }

   onAudioProcess (e)
   {
      if (this.m_pMedia != null)
      {
         this.m_aStat[this.STAT_AUDIO].Inc ();

         let nTime_Current  = this.m_pContext.currentTime;

         let nMult          = e.inputBuffer.sampleRate / this.m_nSampleRate;
         let ChannelData    = e.inputBuffer.getChannelData (0);

         let nTail = this.m_Buffer.nTail;

         if (Number.isInteger (nMult) != false)
         {
            let wSample, x;

            for (wSample=0; wSample<ChannelData.length; wSample+=nMult)
            {
               if ((x = Math.round (ChannelData[wSample] * 32768)) == 32768)
                  x--;

               this.m_Buffer.asSample[this.m_Buffer.nTail++ % this.m_Buffer.nCount] = x;

               this.m_aStat[this.STAT_AUDIO_AMP].Max (ChannelData[wSample]);
            }
         }
         else
         {

            let i, r, a, b, x;

            while (this.m_Convert.nOffset < ChannelData.length - 1)
            {
               i = Math.floor (this.m_Convert.nOffset);
               r = this.m_Convert.nOffset - i;

               a = this.m_Convert.nOffset < 0 ? this.m_Convert.fSample * (0 - this.m_Convert.nOffset) : ChannelData[i] * (1 - r);
               b = this.m_Convert.nOffset < 0 ? ChannelData[0]         * (1 + this.m_Convert.nOffset) : ChannelData[i + 1] * r;

               if ((x = Math.round ((a + b) * 32768)) == 32768)
                  x--;

               this.m_Buffer.asSample[this.m_Buffer.nTail++ % this.m_Buffer.nCount] = x;

               this.m_aStat[this.STAT_AUDIO_AMP].Max (a + b);

               this.m_Convert.nSample++;
               this.m_Convert.nOffset = (this.m_Convert.nSample * e.inputBuffer.sampleRate / this.m_nSampleRate) - this.m_Convert.nBoundary;
            }

            this.m_Convert.fSample    = ChannelData[ChannelData.length - 1];

            this.m_Convert.nBoundary += ChannelData.length;
            this.m_Convert.nOffset   -= ChannelData.length;
         }

         this.m_Buffer.nLength += this.m_Buffer.nTail - nTail;

         this.m_aStat[this.STAT_AUDIO_SAMPLES].Add (this.m_Buffer.nTail - nTail);

         this.m_Buffer.nSlice = Math.floor ((nTime_Current - (this.m_Buffer.nLength / this.m_nSampleRate)) * this.m_nSliceRate);

         if (this.m_Buffer.nLength > this.m_Buffer.nCount)
         {

            this.m_Input.tmHead = 0;

            while (this.m_Buffer.nLength > this.m_Buffer.nCount)
               this.SkipSlice ();
         }
      }

      MV.MVSB.Time.Interrupt ();
   }

   Input (tmServer, wCodec, pArrayBuffer, abData)
   {
      let asSample = new Int16Array (pArrayBuffer);

      let nResult  = 0;
      let wSamples = 0;

      if (this.m_pMedia != null)
      {
         if (this.m_Input.tmHead <= tmServer)
         {
            this.Time (tmServer);
            this.m_aStat[this.STAT_INPUT].Inc ();

            let wSample, nSlice, sLevel, nDamp = 1;

            if (this.m_Input.tmHead == 0)
            {

   let nTime_Current  = this.m_pContext.currentTime;

               while (this.m_Buffer.nLength > this.m_nSamples_Slice * 2)
                  this.SkipSlice ();

               this.m_Input.tmHead = tmServer;
            }
            else
            {
               while (this.m_Input.tmHead < tmServer)
                  this.SkipSlice ();
            }

            if (this.m_Buffer.nLength >= this.m_nSamples_Slice)
            {

               nSlice = this.m_Buffer.nSlice - 1;

   let nTime_Current  = this.m_pContext.currentTime;
               sLevel = 0;

               if (nSlice <= this.m_Output.nSlice  &&  nSlice > this.m_Output.nSlice - this.m_Output.nCount)
                  sLevel = this.m_Output.asLevel[nSlice % this.m_Output.nCount];

               nSlice++;

               if (nSlice <= this.m_Output.nSlice  &&  sLevel <= this.m_Output.asLevel[nSlice % this.m_Output.nCount])
                  sLevel = this.m_Output.asLevel[nSlice % this.m_Output.nCount];

               if (sLevel > this.m_sLevel_Echo)
                  nDamp = Math.pow (2, (sLevel - this.m_sLevel_Echo) * (1 / this.m_sLevel_Supress));

   sLevel = 0;
               for (wSample=0; wSample<this.m_nSamples_Slice; wSample++)
               {
                  asSample[wSample] = this.m_bMute ? 0 : this.m_Buffer.asSample[this.m_Buffer.nHead++ % this.m_Buffer.nCount];
   if (sLevel < asSample[wSample])
      sLevel = asSample[wSample];

                  this.m_aStat[this.STAT_INPUT_AMP].Max (asSample[wSample]);

               }
   this.m_Input.asLevel[nSlice % this.m_Input.nCount] = sLevel;

               this.m_Buffer.nLength -= this.m_nSamples_Slice;

               this.m_Buffer.nSlice += 1;

               wSamples = this.m_nSamples_Slice;

               let anValue = this.m_aStat[this.STAT_AUDIO_AMP].anValue;
               if (anValue[0]  ||  anValue[1]  || anValue[2])
                  this.m_Input.bAudio = true;
               else if (this.m_Input.bAudio  ||  this.m_pContext.currentTime - this.m_Input.nCapture >= 15)
               {
                  this.Release ();
                  setTimeout (this.Capture.bind (this), 1000);
               }
            }
            else
            {

               if (this.m_pNode_Processor)
               {

               }
            }

            this.m_aStat[this.STAT_INPUT_SAMPLES].Add (this.m_nSamples_Slice);

            this.m_Input.tmHead += 1;
         }
   else
   {

   }
      }

      if (wSamples != 0 && this.Encode[wCodec])
      {
         nResult = this.Encode[wCodec] (abData, wSamples, asSample);
      }

      return nResult;
   }

   Output (tmServer, SBA_RProximity_Audio, ByteStream)
   {
      let wResult = -1;
      let sLevel, s, bChannel, wSample, pNode_Source;

      if (this.m_pContext != null  &&  SBA_RProximity_Audio.wSamples > 0)
      {
         this.m_aStat[this.STAT_OUTPUT].Inc ();

         let Buffer = this.m_pContext.createBuffer (SBA_RProximity_Audio.bChannels, SBA_RProximity_Audio.wSamples, this.m_nSampleRate);

         wResult = 0;
         sLevel  = 0;

         for (bChannel=0; bChannel<SBA_RProximity_Audio.bChannels; bChannel++)
         {
            let ChannelData = Buffer.getChannelData (bChannel);

            if (this.Decode[SBA_RProximity_Audio.wCodec])
               wResult += this.Decode[SBA_RProximity_Audio.wCodec] (ChannelData, SBA_RProximity_Audio.wSamples, ByteStream);

            for (wSample=0; wSample<SBA_RProximity_Audio.wSamples; wSample++)
            {
               s = Math.abs (ChannelData[wSample]);
               if (sLevel < s)
                  sLevel = s;
            }
         }

         let nTime_Current  = Math.floor (this.m_pContext.currentTime * this.MICROSECONDSPERSECOND);

         let nSlice = tmServer - this.m_Output.tmServer_Base;

         if (nTime_Current < nSlice * this.MICROSECONDSPERSLICE)
         {

            this.m_Output.tmServer_Base = tmServer - Math.floor (nTime_Current / this.MICROSECONDSPERSLICE);

         }
         else
         {

            let nTime_Delta = nTime_Current - (nSlice * this.MICROSECONDSPERSLICE);

            this.m_aStat[this.STAT_OUTPUT_DELTA].Max (nTime_Delta);

            if (this.m_Output.nDelay * this.MICROSECONDSPERSLICE < nTime_Delta + this.MICROSECONDSPERSLICE)
               this.m_aStat[this.STAT_OUTPUT_DELAY].Inc ();

            if (this.m_aStat[this.STAT_OUTPUT_DELAY].anValue[0] == 4)
            {
               this.m_Output.nDelay += 1;

               this.m_aStat[this.STAT_OUTPUT_DELAY].anValue[0] = 0;
            }

            let n, nDelay = 0, anValue = this.m_aStat[this.STAT_OUTPUT_DELTA].anValue;
            for (n=0; n<anValue.length; n++)
               if (nDelay < anValue[n])
                  nDelay = anValue[n];
            while (this.m_Output.nDelay * this.MICROSECONDSPERSLICE > nDelay + 2 * this.MICROSECONDSPERSLICE)
   {
               this.m_Output.nDelay -= 1;

   }

   if (tmServer % 64 == 0)
   {
      if (this.m_pNode_Processor)
         this.m_Proximity.Emit ('PrintMessage', 'Mic: ' + this.m_aStat[this.STAT_AUDIO ].Last () + ' / ' + this.m_aStat[this.STAT_AUDIO_SAMPLES].Last () + ' / ' + (Math.round (this.m_aStat[this.STAT_AUDIO_AMP].Last () * 1000000) / 1000000) + ' (' + this.m_pContext.sampleRate + ' / ' + this.m_pNode_Processor.bufferSize + ')', 0);
      else this.m_Proximity.Emit ('PrintMessage', 'Mic: DISABLED )', 0);
      this.m_Proximity.Emit ('PrintMessage', 'Inp : ' + this.m_aStat[this.STAT_INPUT ].Last () + ' / ' + this.m_aStat[this.STAT_INPUT_SAMPLES].Last () + ' / ' + this.m_aStat[this.STAT_INPUT_AMP].Last () + ' (' + this.m_sLevel_Echo  + ' / ' + this.m_sLevel_Supress + ')', 1);
      this.m_Proximity.Emit ('PrintMessage', 'Out: ' + this.m_aStat[this.STAT_OUTPUT].Last () + ' / ' + (this.m_aStat[this.STAT_OUTPUT_DELTA].Last () / this.MICROSECONDSPERMILLISECOND) + 'ms / ' + (this.m_Output.nDelay * this.MICROSECONDSPERSLICE / this.MICROSECONDSPERMILLISECOND) + 'ms', 2);
   }

            nSlice += this.m_Output.nDelay;

            if (nSlice > this.m_Output.nSlice)
            {

               if (this.m_Output.nSlice < nSlice - this.m_Output.nCount)
   {

                  this.m_Output.nSlice = nSlice - this.m_Output.nCount;
   }
               while (++this.m_Output.nSlice < nSlice)
   {

                  this.m_Output.asLevel[this.m_Output.nSlice % this.m_Output.nCount] = 0.0000013579;
   }
               this.m_Output.asLevel[this.m_Output.nSlice % this.m_Output.nCount] = sLevel;

               if (!this.m_bDeaf)
               {
                  pNode_Source        = this.m_pContext.createBufferSource ();
                  pNode_Source.buffer = Buffer;
                  pNode_Source.connect (this.m_pContext.destination);
                  pNode_Source.start   (this.m_Output.nSlice * this.MICROSECONDSPERSLICE / this.MICROSECONDSPERSECOND);
               }
            }
            else
            {

            }
         }
      }

      if (wResult < 0)
      {
         ByteStream.Seek (SBA_RProximity_Audio.wSize);

         wResult = SBA_RProximity_Audio.wSize;
      }

      this.m_Proximity.Emit ('onProximity_Tick', tmServer);

      MV.MVSB.Time.Interrupt ();

      return wResult;
   }
}

MV.MVRP.Proximity = class extends MV.MVMF.NOTIFICATION
{
   #pClient;

   pAction = new MV.MVSB.SERVICE.CLIENT.ACTION
   (
      (9 | ((1) << 16)),
      null,
      null,
      false,
      null,
      false
   );

   constructor (pClient)
   {
      super ();

      this.#pClient = pClient;

      this.m_pAudio = new MV.MVRP.Audio (24000, 64, 16, this);

      this.#pClient.Recv_Register (this.pAction, this);
   }

   destructor ()
   {
      this.#pClient.Recv_Unregister (this.pAction);

      this.m_pAudio = this.m_pAudio.destructor ();

      return super.destructor ();
   }

   GetAudio ()
   {
      return this.m_pAudio;
   }

   onRecv_Request (pIAction, wSize, ByteStream)
   {
      let bSuccess = false;
      let dwSize = wSize;

      let wCount, w, wOp;

      if (dwSize == ByteStream.Remaining ())
      {
         if (dwSize >= 8)
         {
            dwSize -= 8;

            const SBA_RProximity =
            {
               tmBase : ByteStream.Read_TIME (),
            };

            if (dwSize >= 4)
            {
               dwSize -= 4;

               wSize  = ByteStream.Read_WORD ();
               wOp    = ByteStream.Read_WORD ();

               if (dwSize >= wSize)
               {
                  dwSize -= wSize;

                  const SBA_RProximity_Control = { wOp: wOp };

                  switch (wOp)
                  {
                     case 1:  SBA_RProximity_Control.dwAvatars = ByteStream.Read_DWORD ();        wSize -= 4; break;
                     case 2:  SBA_RProximity_Control.fCPU      = ByteStream.Read_DWORD () / 1000; wSize -= 4; break;
                     case 3:  SBA_RProximity_Control.dwCounter = ByteStream.Read_DWORD ();        wSize -= 4; break;
                  }

                  if (wSize == 0)
                  {
                     if (wOp > 0)
                     {
                        this.Emit ('onControl', SBA_RProximity_Control);
                     }

                     if (dwSize >= 4)
                     {
                        dwSize -= 4;

                        wSize  = ByteStream.Read_WORD ();
                        wCount = ByteStream.Read_WORD ();

                        if (dwSize >= wSize  &&  wCount * 8 == wSize)
                        {
                           dwSize -= wSize;

                           for (w=0; w<wCount; w++)
                           {
                              const SBA_RProximity_Avatar_Close =
                              {
                                 twRPersonaIx : ByteStream.Read_TWORD8 (),
                              };

                              this.Emit ('onAvatarClose', SBA_RProximity_Avatar_Close);
                           }

                           if (dwSize >= 4)
                           {
                              dwSize -= 4;

                              wSize  = ByteStream.Read_WORD ();
                              wCount = ByteStream.Read_WORD ();

                              if (dwSize >= wSize  &&  wCount * 8 == wSize)
                              {
                                 dwSize -= wSize;

                                 const aSBA_RProximity_Avatar_Open_Ex = [];

                                 for (w=0; w<wCount; w++)
                                 {
                                    aSBA_RProximity_Avatar_Open_Ex[w] =
                                    {
                                       twRPersonaIx : ByteStream.Read_TWORD8 (),
                                    };
                                 }

                                 if (dwSize >= 4)
                                 {
                                    dwSize -= 4;

                                    wSize  = ByteStream.Read_WORD ();
                                    wCount = ByteStream.Read_WORD ();

                                    if (dwSize >= wSize  &&  wCount * 96 == wSize)
                                    {
                                       dwSize -= wSize;

                                       for (w=0; w<wCount; w++)
                                       {

                                          const SBA_RProximity_Avatar_Update_Ex =
                                          {
                                             twRPersonaIx            : ByteStream.Read_TWORD8  (),
                                             pState                  :
                                             {
                                                bControl             : ByteStream.Read_BYTE    (),
                                                bVolume              : ByteStream.Read_BYTE    (),
                                                wFlag                : ByteStream.Read_WORD    (),
                                                bSerial_A            : ByteStream.Read_BYTE    (),
                                                bSerial_B            : ByteStream.Read_BYTE    (),
                                                wOrder               : ByteStream.Read_WORD    (),
                                                abReserved_A         : ByteStream.Read_Pad    (7),
                                                bCoordSys            : ByteStream.Read_BYTE    (),
                                                pPosition_Head       :
                                                {
                                                   pParent           :
                                                   {
                                                      twObjectIx     : ByteStream.Read_TWORD   (),
                                                      wClass         : ByteStream.Read_WORD    (),
                                                   },
                                                   pRelative         :
                                                   {
                                                      vPosition      :
                                                      {
                                                         dX          : ByteStream.Read_DOUBLE  (),
                                                         dY          : ByteStream.Read_DOUBLE  (),
                                                         dZ          : ByteStream.Read_DOUBLE  (),
                                                      },
                                                   },
                                                },
                                                pRotation_Head       : { dwV: ByteStream.Read_DWORD () },
                                                pRotation_Body       : { dwV: ByteStream.Read_DWORD () },
                                                pPosition_Hand_Left  : { dwV: ByteStream.Read_DWORD () },
                                                pRotation_Hand_Left  : { dwV: ByteStream.Read_DWORD () },
                                                pPosition_Hand_Right : { dwV: ByteStream.Read_DWORD () },
                                                pRotation_Hand_Right : { dwV: ByteStream.Read_DWORD () },
                                                bHand_Left           : ByteStream.Read_Binary (6),
                                                bHand_Right          : ByteStream.Read_Binary (6),
                                                bFace                : ByteStream.Read_Binary (4),
                                             },
                                          };

                                          this.Emit ('onAvatarUpdate', { aSBA_RProximity_Avatar_Open_Ex, SBA_RProximity_Avatar_Update_Ex });
                                       }

                                       if (dwSize >= 4)
                                       {
                                          dwSize -= 4;

                                          wSize  = ByteStream.Read_WORD ();
                                          wCount = ByteStream.Read_WORD ();

                                          if (dwSize >= wSize  &&  wCount * 8 == wSize)
                                          {
                                             dwSize -= wSize;

                                             for (w=0; w<wCount; w++)
                                             {
                                                const SBA_RProximity_Avatar_Hide =
                                                {
                                                   twRPersonaIx : ByteStream.Read_TWORD8 (),
                                                };

                                                this.Emit ('onAvatarHide', SBA_RProximity_Avatar_Hide);
                                             }

                                             if (dwSize >= 8)
                                             {
                                                dwSize -= 8;

                                                const SBA_RProximity_Audio =
                                                {
                                                   wSize           : ByteStream.Read_WORD (),
                                                   wCodec          : ByteStream.Read_WORD (),
                                                   wSamples        : ByteStream.Read_WORD (),
                                                   bChannels       : ByteStream.Read_BYTE (),
                                                   bBytesPerSample : ByteStream.Read_BYTE (),
                                                }

                                                if (dwSize >= SBA_RProximity_Audio.wSize)
                                                {
                                                   dwSize -= SBA_RProximity_Audio.wSize;

                                                   if (this.m_pAudio.Output (SBA_RProximity.tmBase, SBA_RProximity_Audio, ByteStream) == SBA_RProximity_Audio.wSize)
                                                   {
                                                      if (dwSize == 0)
                                                      {
                                                         bSuccess = true;
                                                      }
                                                   }
                                                }
                                             }
                                          }
                                       }
                                    }
                                 }
                              }
                           }
                        }
                     }
                  }
               }
            }
         }
      }

      if (bSuccess == false)
         debugger;

      return false;
   }
}

MV.MVRP.Audio.STAT = class
{
   constructor (Audio)
   {
      this.Audio = Audio;

      this.nGroup  = 1;
      this.anValue = [ 0, 0, 0, 0 ];
   }

   Inc ()
   {
      this.anValue[0]++;
   }

   Add (nValue)
   {
      this.anValue[0] += nValue;
   }

   Max (nValue)
   {
      if (this.anValue[0] < nValue)
         this.anValue[0] = nValue;
   }

   Value (n)
   {
      return this.anValue[n];
   }

   Last ()
   {
      return this.Value (1);
   }
}

MV.MVRP.MSF = class extends MV.MVMF.NOTIFICATION
{
   static eSTATE =
   {
      NOTREADY                : 0,
      LOGGINGIN_AUTHENTICATE  : 1,
      READY_LOGGEDOUT         : 2,
      READY_LOGGEDIN          : 3,
      ERROR                   : 4
   };

   static eMETHOD =
   {
      GET           : 0,
      POST          : 1
   };

   eSTATE = MV.MVRP.MSF.eSTATE;

   #nRefCount;
   #apSvc;
   #pLnG;
   #pRUser;
   #pXHR;
   #bCheckSvc;
   #XHRError;
   #pMSFConfig;
   #bLnGAlloc;

   constructor (sURL, kMethod, pLnGPrimary)
   {
      super ();

      this.#nRefCount   = 0;
      this.#apSvc       = {};
      this.#pLnG        = pLnGPrimary;
      this.#bLnGAlloc   = false;
      this.#pRUser      = null;
      this.#pMSFConfig  = {};

      this.#XHRError    = null;

      this.#bCheckSvc   = false;

      this.#pXHR = new XMLHttpRequest ();

      this.#pXHR.onreadystatechange = this.#ReadyStateChange.bind (this);

      this.#pXHR.open ((kMethod == MV.MVRP.MSF.eMETHOD.GET ? 'GET' : 'POST'), sURL);

      this.#pXHR.setRequestHeader ('Accept', 'application/json');

      this.#nRefCount++;
      this.#pXHR.send ('');
   }

   async destructor ()
   {
      await this.SafeClose ();

      this.#Unload ();

      for (let sName in this.#apSvc)
      {
         this.#apSvc[sName].pLnG.Detach (this);
         this.#apSvc[sName].pLnG = MV.MVMF.Core.LnG_Close (this.#apSvc[sName].pLnG);
      }

      if (this.#pLnG != null)
      {
         this.#pLnG.Detach (this);

         if (this.#bLnGAlloc)
            this.#pLnG = MV.MVMF.Core.LnG_Close (this.#pLnG);
      }

      return super.destructor ();
   }

   SafeClose ()
   {
      return new Promise ((resolve, reject) => {
         const checkCondition = () => {
            if (this.#nRefCount == 0)
            {
               resolve ();
            }
            else
            {
               setTimeout (checkCondition, 100);
            }
         };

         checkCondition ();
      });
   }

   #ReadyStateChange ()
   {
      if (this.#pXHR.readyState == 4)
      {
         this.#nRefCount--;

         if (this.#pXHR.status == 200)
         {

            try
            {
               this.#pMSFConfig = JSON.parse (this.#pXHR.responseText);

               if (this.#pMSFConfig["primary"])
               {
                  let pPrimary = this.#pMSFConfig["primary"];
                  let pServices = pPrimary["services"];
                  let pRequire;

                  if ((pRequire = MV.MVMF.Core.Require (pPrimary.sRequire, pPrimary.sService, pPrimary.sNamespace)) != null)
                  {
                     this.#pLnG      = MV.MVMF.Core.LnG_Open (pPrimary.sNamespace, pPrimary.sService, pPrimary.sConnect);
                     this.#bLnGAlloc   = true;
                     this.#pLnG.Attach (this);

                     for (let sName in pServices)
                     {
                        let pConfig = pServices[sName];

                        if ((pRequire = MV.MVMF.Core.Require (pConfig.sRequire, pConfig.sService, pConfig.sNamespace)) != null)
                        {
                           this.#apSvc[sName] = {};
                           this.#apSvc[sName].bRequired = pConfig.bRequired;
                           this.#apSvc[sName].bAuth     = pConfig.bAuth;
                           this.#apSvc[sName].pLnG      = MV.MVMF.Core.LnG_Open (pConfig.sNamespace, pConfig.sService, pConfig.sConnect);
                           this.#apSvc[sName].pLnG.Attach (this);
                        }
                     }
                  }
               }
               else if (this.#pLnG)
               {
                  this.#pLnG.Attach (this);
               }
               else this.#bCheckSvc = true;

               if (this.#pMSFConfig["map"])
               {
                  let pConfig = this.#pMSFConfig["map"];
                  let pRequire;

                  if ((pRequire = MV.MVMF.Core.Require (pConfig.sRequire, pConfig.sService, pConfig.sNamespace)) != null)
                  {
                     this.#apSvc["map"] = {};
                     this.#apSvc["map"].bAuth       = pConfig.bAuth;
                     this.#apSvc["map"].bRequired   = true;
                     this.#apSvc["map"].pLnG        = MV.MVMF.Core.LnG_Open (pConfig.sNamespace, pConfig.sService, pConfig.sConnect);
                     this.#apSvc["map"].pLnG.Attach (this);
                  }
               }
            }
            catch (e)
            {
               this.#XHRError = {
                  statusText: 'Not a JSON File',
                  status:     404
               };
               this.ReadyState (this.eSTATE.ERROR);
            }
         }
         else
         {
            this.#XHRError = {
               statusText: this.#pXHR.statusText,
               status:     this.#pXHR.status
            };
            this.ReadyState (this.eSTATE.ERROR);
         }
      }
   }

   #RSP_Token (pIAction, Param)
   {
      if (pIAction.dwResult == 0)
      {
         this.#apSvc[Param].pLnG.Login ('token=' + MV.MVMF.Escape (pIAction.pResponse.acToken64U_RP1));
      }
      else
      {
         console.log ('ERROR: ' + pIAction.dwResult);
      }
   }

   #SND_Token ()
   {
      let pRPersona = this.#pLnG.Model_Open ('RPersona', this.#pRUser.twRPersonaIx_Default);

      for (let sName in this.#apSvc)
      {
         if (this.#apSvc[sName].bAuth)
         {
            let aName = this.#apSvc[sName].pLnG.sNamespace.split ('/');
            pRPersona.Send ('TOKEN', { sRDCompanyId: aName[0], sRDServiceId: aName[1] }, this, this.#RSP_Token, sName);
         }
      }

      this.#pLnG.Model_Close (pRPersona);
   }

   #Unload ()
   {
      if (this.#pRUser != null)
      {
         this.#pRUser.Detach (this);
         this.#pRUser = this.#pLnG.Model_Close (this.#pRUser);
      }
   }

   onReadyState (pNotice)
   {
      if (pNotice.pCreator == this.#pLnG)
      {
         switch (this.#pLnG.ReadyState ())
         {
         case this.#pLnG.eSTATE.DISCONNECTED:
            for (let sName in this.#apSvc)
            {
               if (this.#apSvc[sName].bAuth)
               {
                  this.#apSvc[sName].pLnG.Logout ();
               }
            }

            this.#bCheckSvc = false;
            this.ReadyState (this.eSTATE.NOTREADY);
            break;

         case this.#pLnG.eSTATE.LOGGEDOUT:
            for (let sName in this.#apSvc)
            {
               if (this.#apSvc[sName].bAuth)
               {
                  this.#apSvc[sName].pLnG.Logout ();
               }
            }

            this.#Unload ();

            this.#bCheckSvc = true;
            break;

         case this.#pLnG.eSTATE.LOGGEDIN:
            if (this.#pRUser == null)
            {
               this.#pRUser = this.#pLnG.Model_Open ('RUser', this.#pLnG.pSession.twUserIx);
               this.#pRUser.Attach (this);
            }
            else if (this.#pRUser.IsReady ())
            {
               this.#SND_Token ();
            }

            this.#bCheckSvc = true;
            break;
         }
      }
      else if (pNotice.pCreator == this.#pRUser && this.#pRUser.IsReady ())
      {
         this.#SND_Token ();
      }
      else if (this.#pLnG)
      {
         if (pNotice.pCreator == this.#pLnG.pSession && this.#pLnG.pSession.ReadyState () == this.#pLnG.pSession.eSTATE.LOGGINGIN_AUTHENTICATE)
         {
            this.ReadyState (this.eSTATE.LOGGINGIN_AUTHENTICATE);
         }
      }

      if (this.#bCheckSvc)
      {
         this.#bCheckSvc = false;
         for (let sName in this.#apSvc)
         {
            if (this.#apSvc[sName].bRequired && this.#apSvc[sName].pLnG.IsReady () == false)
               this.#bCheckSvc = true;
         }

         if (this.#bCheckSvc == false)
            this.ReadyState ((this.#pLnG && this.#pLnG.ReadyState () == this.#pLnG.eSTATE.LOGGEDIN) ? this.eSTATE.READY_LOGGEDIN : this.eSTATE.READY_LOGGEDOUT);
      }
  }

   get pLnG ()         { return this.#pLnG;                                             }
   get twRPersonaIx () { return this.#pRUser ? this.#pRUser.twRPersonaIx_Default : 0; }
   get XHRError ()     { return this.#XHRError;                                           }
   get pMSFConfig ()   { return this.#pMSFConfig;                                         }

   IsReady ()
   {
      let nReadyState = this.ReadyState ();

      return (nReadyState == this.eSTATE.READY_LOGGEDIN || nReadyState == this.eSTATE.READY_LOGGEDOUT);
   }

   GetLnG (sName)
   {
      return this.#apSvc[sName] ? this.#apSvc[sName].pLnG : '';
   }

   GetMapRootUrl ()
   {
      return (this.#pMSFConfig && this.#pMSFConfig["map"] && this.#pMSFConfig["map"].sRootUrl) ? this.#pMSFConfig["map"].sRootUrl : '';
   }

   GetMapWClass ()
   {
      return (this.#pMSFConfig && this.#pMSFConfig["map"]) ? this.#pMSFConfig["map"].wClass : undefined;
   }

   GetMapObjectIx ()
   {
      return (this.#pMSFConfig && this.#pMSFConfig["map"]) ? this.#pMSFConfig["map"].twObjectIx : undefined;
   }
}

MV.MVRP.Package.RP1 = class extends MV.MVMF.PLUGIN.PACKAGE
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVSB',
         'RP1',

         {
            aService  : [
                           'MVSB/MVSB',
                        ],
            aModel    : [
                           'MVMF/Session_C2a',

                           'MVSB/SBTime',

                           'MVXP/RegionRoot',
                           'MVXP/Region',
                           'MVXP/Region_SMSPrefix',
                           'MVXP/Region_SMSFormat',
                           'MVXP/UserRoot',
                           'MVXP/User',
                           'MVXP/User_Session',

                           'MVRP/RUser',
                           'MVRP/RPersona',
                           'MVRP/RRoot',
                           'MVRP/RZone'
                        ],
            aSource   : [
                           'MVSB/MVSB:SBTime',

                           'MVXP/MVSB:Session_C2a',

                           'MVXP/MVSB:RegionRoot',
                           'MVXP/MVSB:Region',
                           'MVXP/MVSB:Region_SMSPrefix',
                           'MVXP/MVSB:Region_SMSFormat',
                           'MVXP/MVSB:UserRoot',
                           'MVXP/MVSB:User',
                           'MVXP/MVSB:User_Session',

                           'MVRP/MVSB:RUser',
                           'MVRP/MVSB:RPersona',
                           'MVRP/MVSB:RRoot',
                           'MVRP/MVSB:RZone',
                        ]
         }
      );
   }

}

MV.MVRP.Package.RP1.FACTORY = class extends MV.MVMF.PLUGIN.PACKAGE.FACTORY
{

   Reference (sNamespace)
   {
      return new MV.MVRP.Package.RP1.IREFERENCE (this.sID, sNamespace, this.pConfig);
   }
}

MV.MVRP.Package.RP1.IREFERENCE = class extends MV.MVMF.PLUGIN.PACKAGE.IREFERENCE
{

   Create (pParam)
   {
      return new MV.MVRP.Package.RP1 (this, pParam);
   }
}

MV.MVRP.Install = function (pCore, pPlugin)
{
   let bResult = true;

   if (this.pRequire = pCore.Require ('MVSB,MVXP'))
   {
      this.apFactory_Model =
      [
         MV.MVRP.RUSER               .factory (),
         MV.MVRP.RPERSONA            .factory (),
         MV.MVRP.RROOT               .factory (),
         MV.MVRP.RZONE               .factory (),
      ];

      this.apFactory_Source =
      [
         MV.MVRP.SB_RUSER            .factory (),
         MV.MVRP.SB_RPERSONA         .factory (),
         MV.MVRP.SB_RROOT            .factory (),
         MV.MVRP.SB_RZONE            .factory (),
      ];

      this.apFactory_Package =
      [
         MV.MVRP.Package.RP1         .factory ()
      ];

      pPlugin.Factory_Models   (this.apFactory_Model);
      pPlugin.Factory_Sources  (this.apFactory_Source);
      pPlugin.Factory_Packages (this.apFactory_Package);
   }
   else bResult = false;

   return bResult;
}

MV.MVRP.Unstall = function (pCore, pPlugin)
{
   let n;

   if (this.pRequire)
   {
      for (n=0; n<this.apFactory_Model.length; n++)
         this.apFactory_Model[n] = this.apFactory_Model[n].destructor ();

      for (n=0; n<this.apFactory_Source.length; n++)
         this.apFactory_Source[n] = this.apFactory_Source[n].destructor ();

      for (n=0; n<this.apFactory_Package.length; n++)
         this.apFactory_Package[n] = this.apFactory_Package[n].destructor ();

      this.pRequire = pCore.Release (this.pRequire);
   }
}

