
/*
import { MV } from '@metaversalcorp/mvmf';
import '@metaversalcorp/mvrp';
import '@metaversalcorp/mvrp_dev';
import '@metaversalcorp/mvrest';
import '@metaversalcorp/mvio';
*/
/*
const { MV     } = require ('@metaversalcorp/mvmf');
require ('@metaversalcorp/mvrp');
require ('@metaversalcorp/mvrp_dev');
require ('@metaversalcorp/mvrest');
require ('@metaversalcorp/mvio');
*/

MV.MVRP.Map = MV.Library ('MVRP_Map', 'Copyright 2014-2024 Metaversal Corporation. All rights reserved.', 'Metaversal RP1 Map', '0.23.13');

MV.MVRP.Map.Class.RMCOMMON_TYPE = class extends MV.MVMF.Class.BASE
{
   constructor (bType, bSubtype, bFiction, bMovable)
   {
      super ();

      this.Set (bType, bSubtype, bFiction, bMovable);
   }

   Set (bType, bSubtype, bFiction, bMovable)
   {
      this.bType    = bType;
      this.bSubtype = bSubtype;
      this.bFiction = bFiction;
      this.bMovable = bMovable;
   }
}

MV.MVRP.Map.Class.RMCOMMON_OWNER = class extends MV.MVMF.Class.BASE
{
   constructor (twRPersonaIx)
   {
      super ();

      this.Set (twRPersonaIx);
   }

   Set (twRPersonaIx)
   {
      this.twRPersonaIx = twRPersonaIx;
   }
}

MV.MVRP.Map.Class.RMCOMMON_RESOURCE = class extends MV.MVMF.Class.BASE
{
   constructor (qwResource, sName, sReference)
   {
      super ();

      this.Set (qwResource, sName, sReference);
   }

   Set (qwResource, sName, sReference)
   {
      this.qwResource = qwResource;
      this.sName      = sName;
      this.sReference = sReference;
   }
}

MV.MVRP.Map.Class.RMCOMMON_TRANSFORM = class extends MV.MVMF.Class.BASE
{
   constructor (vPosition, qRotation, vScale)
   {
      super ();

      this.vPosition = new MV.MVRP.Class.DOUBLE3 ();
      this.qRotation = new MV.MVRP.Class.DOUBLE4 ();
      this.vScale    = new MV.MVRP.Class.DOUBLE3 ();

      this.Set (vPosition, qRotation, vScale);
   }

   destructor ()
   {
      this.vPosition = this.vPosition.destructor ();
      this.qRotation = this.qRotation.destructor ();
      this.vScale    = this.vScale   .destructor ();

      return super.destructor ();
   }

   Set (vPosition, qRotation, vScale)
   {
      let o;

      if (o = vPosition) this.vPosition.Set (o.dX, o.dY, o.dZ);
      if (o = qRotation) this.qRotation.Set (o.dX, o.dY, o.dZ, o.dW);
      if (o = vScale   ) this.vScale   .Set (o.dX, o.dY, o.dZ);
   }
}

MV.MVRP.Map.Class.RMCOMMON_ORBIT_SPIN = class extends MV.MVMF.Class.BASE
{
   constructor (tmPeriod, tmOrigin, dA, dB)
   {
      super ();

      this.Set (tmPeriod, tmOrigin, dA, dB);
   }

   Set (tmPeriod, tmOrigin, dA, dB)
   {
      this.tmPeriod = tmPeriod;
      this.tmOrigin = tmOrigin;
      this.dA       = dA;
      this.dB       = dB;
   }
}

MV.MVRP.Map.Class.RMCOMMON_BOUND = class extends MV.MVMF.Class.BASE
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
}

MV.MVRP.Map.Class.VECTOR3 = class extends MV.MVMF.Class.BASE
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
   };
};

MV.MVRP.Map.Class.QUATERNION = class extends MV.MVMF.Class.BASE
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
   };
};

MV.MVRP.Map.Class.ELLIPSOID = class extends MV.MVMF.Class.BASE
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
   };
};

MV.MVRP.Map.Class.RMROOT_NAME = class extends MV.MVMF.Class.BASE
{
   constructor (wsRMRootId)
   {
      super ();

      this.Set (wsRMRootId);
   }

   Set (wsRMRootId)
   {
      this.wsRMRootId = wsRMRootId;
   }
}

MV.MVRP.Map.Class.RMCOBJECT_NAME = class extends MV.MVMF.Class.BASE
{
   constructor (wsRMCObjectId)
   {
      super ();

      this.Set (wsRMCObjectId);
   }

   Set (wsRMCObjectId)
   {
      this.wsRMCObjectId = wsRMCObjectId;
   }
}

MV.MVRP.Map.Class.RMCOBJECT_PROPERTIES = class extends MV.MVMF.Class.BASE
{
   constructor (fMass, fGravity, fColor, fBrightness, fReflectivity)
   {
      super ();

      this.Set (fMass, fGravity, fColor, fBrightness, fReflectivity);
   }

   Set (fMass, fGravity, fColor, fBrightness, fReflectivity)
   {
      this.fMass         = fMass;
      this.fGravity      = fGravity;
      this.fColor        = fColor;
      this.fBrightness   = fBrightness;
      this.fReflectivity = fReflectivity;
   }
}

MV.MVRP.Map.Class.RMTOBJECT_NAME = class extends MV.MVMF.Class.BASE
{
   constructor (wsRMTObjectId)
   {
      super ();

      this.Set (wsRMTObjectId);
   }

   Set (wsRMTObjectId)
   {
      this.wsRMTObjectId = wsRMTObjectId;
   }
}

MV.MVRP.Map.Class.RMTOBJECT_PROPERTIES = class extends MV.MVMF.Class.BASE
{
   constructor (bLockToGround, bYouth, bAdult, bAvatar, abReserved_A)
   {
      super ();

      this.Set (bLockToGround, bYouth, bAdult, bAvatar, abReserved_A);
   }

   Set (bLockToGround, bYouth, bAdult, bAvatar, abReserved_A)
   {
      this.bLockToGround = bLockToGround;
      this.bYouth        = bYouth;
      this.bAdult        = bAdult;
      this.bAvatar       = bAvatar;
   }
}

MV.MVRP.Map.Class.RMPOBJECT_NAME = class extends MV.MVMF.Class.BASE
{
   constructor (wsRMPObjectId)
   {
      super ();

      this.Set (wsRMPObjectId);
   }

   Set (wsRMPObjectId)
   {
      this.wsRMPObjectId = wsRMPObjectId;
   }
}

MV.MVRP.Map.Class.VECTOR3_SB = class extends MV.MVRP.Map.Class.VECTOR3
{
   static MAP  =
   {
      dX                : MV.MVSB.MAP.FIELD.DOUBLE,
      dY                : MV.MVSB.MAP.FIELD.DOUBLE,
      dZ                : MV.MVSB.MAP.FIELD.DOUBLE,
   };
}

MV.MVRP.Map.Class.QUATERNION_SB = class extends MV.MVRP.Map.Class.QUATERNION
{
   static MAP  =
   {
      dX                : MV.MVSB.MAP.FIELD.DOUBLE,
      dY                : MV.MVSB.MAP.FIELD.DOUBLE,
      dZ                : MV.MVSB.MAP.FIELD.DOUBLE,
      dW                : MV.MVSB.MAP.FIELD.DOUBLE,
   };
}

MV.MVRP.Map.Class.RMCOMMON_BOUND_SB = class extends MV.MVRP.Map.Class.RMCOMMON_BOUND
{
   static PAD =           MV.MVSB.MAP.FIELD.PAD (48);
   static MAP =
   {
      abReserved_A      : MV.MVSB.MAP.FIELD.PAD (24),
      dX                : MV.MVSB.MAP.FIELD.DOUBLE,
      dY                : MV.MVSB.MAP.FIELD.DOUBLE,
      dZ                : MV.MVSB.MAP.FIELD.DOUBLE
   };
}

MV.MVRP.Map.Class.RMCOMMON_ORBIT_SPIN_SB = class extends MV.MVRP.Map.Class.RMCOMMON_ORBIT_SPIN
{
   static PAD =           MV.MVSB.MAP.FIELD.PAD (32);
   static MAP =
   {
      tmPeriod          : MV.MVSB.MAP.FIELD.TIME,
      tmOrigin          : MV.MVSB.MAP.FIELD.TIME,
      dA                : MV.MVSB.MAP.FIELD.DOUBLE,
      dB                : MV.MVSB.MAP.FIELD.DOUBLE,
   };
}

MV.MVRP.Map.Class.RMCOMMON_OWNER_SB = class extends MV.MVRP.Map.Class.RMCOMMON_OWNER
{
   static PAD =           MV.MVSB.MAP.FIELD.PAD (8);
   static MAP =
   {
      twRPersonaIx      : MV.MVSB.MAP.FIELD.TWORD8,
   };
}

MV.MVRP.Map.Class.RMCOMMON_TRANSFORM_SB = class extends MV.MVRP.Map.Class.RMCOMMON_TRANSFORM
{
   static PAD =           MV.MVSB.MAP.FIELD.PAD (80);
   static MAP =
   {
      vPosition         : MV.MVRP.Class.DOUBLE3.MAP,
      qRotation         : MV.MVRP.Class.DOUBLE4.MAP,
      vScale            : MV.MVRP.Class.DOUBLE3.MAP,
   };
}

MV.MVRP.Map.Class.RMCOMMON_TYPE_SB = class extends MV.MVRP.Map.Class.RMCOMMON_TYPE
{
   static PAD =           MV.MVSB.MAP.FIELD.PAD (8);
   static MAP =
   {
      bType             : MV.MVSB.MAP.FIELD.BYTE,
      bSubtype          : MV.MVSB.MAP.FIELD.BYTE,
      bFiction          : MV.MVSB.MAP.FIELD.BYTE,
      bMovable          : MV.MVSB.MAP.FIELD.BYTE,
      abReserved_A      : MV.MVSB.MAP.FIELD.PAD (4),
   };
}

MV.MVRP.Map.Class.RMCOMMON_RESOURCE_SB = class extends MV.MVRP.Map.Class.RMCOMMON_RESOURCE
{
   static PAD =           MV.MVSB.MAP.FIELD.PAD (104);
   static MAP =
   {
      qwResource        : MV.MVSB.MAP.FIELD.QWORD,
      sName             : MV.MVSB.MAP.FIELD.STRING (32),
      sReference        : MV.MVSB.MAP.FIELD.STRING (64),
   };
}

MV.MVRP.Map.Class.RMCOBJECT_NAME_SB = class extends MV.MVRP.Map.Class.RMCOBJECT_NAME
{
   static MAP =
   {
      wsRMCObjectId     : MV.MVSB.MAP.FIELD.STRING_W (48),
   };
}

MV.MVRP.Map.Class.RMCOBJECT_PROPERTIES_SB = class extends MV.MVRP.Map.Class.RMCOBJECT_PROPERTIES
{
   static MAP =
   {
      fMass             : MV.MVSB.MAP.FIELD.FLOAT,
      fGravity          : MV.MVSB.MAP.FIELD.FLOAT,
      fColor            : MV.MVSB.MAP.FIELD.FLOAT,
      fBrightness       : MV.MVSB.MAP.FIELD.FLOAT,
      fReflectivity     : MV.MVSB.MAP.FIELD.FLOAT,
      abReserved_A      : MV.MVSB.MAP.FIELD.PAD (12)
   };
}

MV.MVRP.Map.Class.RMPOBJECT_NAME_SB = class extends MV.MVMF.Class.BASE
{
   static MAP =
   {
      wsRMPObjectId     : MV.MVSB.MAP.FIELD.STRING_W (48),
   };
}

MV.MVRP.Map.Class.RMPOBJECT_PROPERTIES_SB = class extends MV.MVMF.Class.BASE
{
   static PAD =           MV.MVSB.MAP.FIELD.PAD (32);
}

MV.MVRP.Map.Class.RMTOBJECT_NAME_SB = class extends MV.MVRP.Map.Class.RMTOBJECT_NAME
{
   static MAP =
   {
      wsRMTObjectId     : MV.MVSB.MAP.FIELD.STRING_W (48),
   };
}

MV.MVRP.Map.Class.RMTOBJECT_PROPERTIES_SB = class extends MV.MVRP.Map.Class.RMTOBJECT_PROPERTIES
{
   static MAP =
   {
      bLockToGround     : MV.MVSB.MAP.FIELD.BYTE,
      bYouth            : MV.MVSB.MAP.FIELD.BYTE,
      bAdult            : MV.MVSB.MAP.FIELD.BYTE,
      bAvatar           : MV.MVSB.MAP.FIELD.BYTE,
      abReserved_A      : MV.MVSB.MAP.FIELD.PAD (28),
   };
}

MV.MVRP.Map.Class.RMROOT_NAME_SB = class extends MV.MVRP.Map.Class.RMROOT_NAME
{
   static MAP =
   {
      wsRMRootId        : MV.MVSB.MAP.FIELD.STRING_W (48),
   };
}

MV.MVRP.Map.Class.RMROOT_PROPERTIES_SB = class
{
   static PAD =           MV.MVSB.MAP.FIELD.PAD (32);
}

MV.MVRP.SB_RROOT.apAction['RMROOT_OPEN'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (5 | ((52) << 16)),
   new MV.MVSB.MAP
   ({
      twRRootIx                        : MV.MVSB.MAP.FIELD.TWORD8,
      abReserved_A                     : MV.MVSB.MAP.FIELD.PAD (16),
      pName                            : MV.MVRP.Map.Class.RMROOT_NAME.MAP,
      pOwner                           : MV.MVRP.Map.Class.RMCOMMON_OWNER.MAP,
   }),
   new MV.MVSB.MAP
   ({
      twRMRootIx                       : MV.MVSB.MAP.FIELD.TWORD8,
   })
);

MV.MVRP.SB_RROOT.apAction['RMROOT_CLOSE'] = new MV.MVSB.SERVICE.CLIENT.ACTION
(
   (6 | ((52) << 16)),
   new MV.MVSB.MAP
   ({
      twRRootIx                        : MV.MVSB.MAP.FIELD.TWORD8,
      abReserved_A                     : MV.MVSB.MAP.FIELD.PAD (8),
      twRMRootIx                       : MV.MVSB.MAP.FIELD.TWORD8,
   })
);

MV.MVRP.Map.SB_RMROOT = class extends MV.MVSB.SB_OBJECT
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVSB',
         'RMRoot',

         70,

         MV.MVRP.Map.SB_RMROOT.apAction,

         true,

         new MV.MVSB.MAP
         ({
            pName                   : MV.MVRP.Map.Class.RMROOT_NAME.MAP,
            pType                   : MV.MVRP.Map.Class.RMCOMMON_TYPE_SB.PAD,
            pOwner                  : MV.MVRP.Map.Class.RMCOMMON_OWNER.MAP,
            pResource               : MV.MVRP.Map.Class.RMCOMMON_RESOURCE_SB.PAD,
            pTransform              : MV.MVRP.Map.Class.RMCOMMON_TRANSFORM_SB.PAD,
            pOrbit_Spin             : MV.MVRP.Map.Class.RMCOMMON_ORBIT_SPIN_SB.PAD,
            pBound                  : MV.MVRP.Map.Class.RMCOMMON_BOUND_SB.PAD,
            pProperties             : MV.MVRP.Map.Class.RMROOT_PROPERTIES_SB.PAD,

                                      wSize_Partial: [MV.MVSB.MAP.FIELD.eTYPE.SIZE, 0, "Partial"],
         })
      );
   }

}

MV.MVRP.Map.SB_RMROOT.FACTORY = class extends MV.MVSB.SB_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVRP.Map.SB_RMROOT (this.pReference, this.pMap, pClient);
   }
}

MV.MVRP.Map.SB_RMROOT.apAction =
{
   NAME:                new MV.MVSB.SERVICE.CLIENT.ACTION
                        (
                           (1 | ((70) << 16)),
                           new MV.MVSB.MAP
                           ({
                              twRMRootIx                       : MV.MVSB.MAP.FIELD.TWORD8,
                              abReserved_A                     : MV.MVSB.MAP.FIELD.PAD (8),
                              pName                            : MV.MVRP.Map.Class.RMCOBJECT_NAME.MAP,
                           })
                        ),

   OWNER:               new MV.MVSB.SERVICE.CLIENT.ACTION
                        (
                           (2 | ((70) << 16)),
                           new MV.MVSB.MAP
                           ({
                              twRMRootIx                       : MV.MVSB.MAP.FIELD.TWORD8,
                              abReserved_A                     : MV.MVSB.MAP.FIELD.PAD (8),
                              pOwner                           : MV.MVRP.Map.Class.RMCOMMON_OWNER.MAP,
                           })
                        ),

   RMCOBJECT_OPEN:      new MV.MVSB.SERVICE.CLIENT.ACTION
                        (
                           (3 | ((70) << 16)),
                           new MV.MVSB.MAP
                           ({
                              twRMRootIx                       : MV.MVSB.MAP.FIELD.TWORD8,
                              abReserved_A                     : MV.MVSB.MAP.FIELD.PAD (16),
                              pName                            : MV.MVRP.Map.Class.RMCOBJECT_NAME.MAP,
                              pType                            : MV.MVRP.Map.Class.RMCOMMON_TYPE.MAP,
                              pOwner                           : MV.MVRP.Map.Class.RMCOMMON_OWNER.MAP,
                              pResource                        : MV.MVRP.Map.Class.RMCOMMON_RESOURCE.MAP,
                              pTransform                       : MV.MVRP.Map.Class.RMCOMMON_TRANSFORM.MAP,
                              pOrbit_Spin                      : MV.MVRP.Map.Class.RMCOMMON_ORBIT_SPIN.MAP,
                              pBound                           : MV.MVRP.Map.Class.RMCOMMON_BOUND.MAP,
                              pProperties                      : MV.MVRP.Map.Class.RMCOBJECT_PROPERTIES.MAP,
                              pCoord                           : MV.MVRP.Class.DCOORD.MAP,
                           }),
                           new MV.MVSB.MAP
                           ({
                              twRMCObjectIx                    : MV.MVSB.MAP.FIELD.TWORD8,
                           })
                        ),

   RMCOBJECT_CLOSE:     new MV.MVSB.SERVICE.CLIENT.ACTION
                        (
                           (4 | ((70) << 16)),
                           new MV.MVSB.MAP
                           ({
                              twRMRootIx                       : MV.MVSB.MAP.FIELD.TWORD8,
                              abReserved_A                     : MV.MVSB.MAP.FIELD.PAD (8),
                              twRMCObjectIx                    : MV.MVSB.MAP.FIELD.TWORD8,
                           })
                        )
};

MV.MVRP.Map.SB_RMCOBJECT = class extends MV.MVSB.SB_OBJECT
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVSB',
         'RMCObject',

         71,

         MV.MVRP.Map.SB_RMCOBJECT.apAction,

         true,

         new MV.MVSB.MAP
         ({
            pName          : MV.MVRP.Map.Class.RMCOBJECT_NAME_SB.MAP,
            pType          : MV.MVRP.Map.Class.RMCOMMON_TYPE_SB.MAP,
            pOwner         : MV.MVRP.Map.Class.RMCOMMON_OWNER_SB.MAP,
            pResource      : MV.MVRP.Map.Class.RMCOMMON_RESOURCE_SB.MAP,
            pTransform     : MV.MVRP.Map.Class.RMCOMMON_TRANSFORM_SB.MAP,
            pOrbit_Spin    : MV.MVRP.Map.Class.RMCOMMON_ORBIT_SPIN_SB.MAP,
            pBound         : MV.MVRP.Map.Class.RMCOMMON_BOUND_SB.MAP,
            pProperties    : MV.MVRP.Map.Class.RMCOBJECT_PROPERTIES_SB.MAP,

                             wSize_Partial: [MV.MVSB.MAP.FIELD.eTYPE.SIZE, 0, "Partial"],

            abReserved_A   : MV.MVSB.MAP.FIELD.PAD (56),
         })
      );
   }

}

MV.MVRP.Map.SB_RMCOBJECT.FACTORY = class extends MV.MVSB.SB_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVRP.Map.SB_RMCOBJECT (this.pReference, this.pMap, pClient);
   }
}

MV.MVRP.Map.SB_RMCOBJECT.apAction =
{
   CAPTURE:             new MV.MVSB.SERVICE.CLIENT.ACTION
                        (
                           (1 | ((71) << 16)),
                           new MV.MVSB.MAP
                           ({
                              twRMCObjectIx        : MV.MVSB.MAP.FIELD.TWORD8,
                              abReserved_A         : MV.MVSB.MAP.FIELD.PAD (8),
                              twRPersonaIx         : MV.MVSB.MAP.FIELD.TWORD8,
                           })
                        ),

   RELEASE:             new MV.MVSB.SERVICE.CLIENT.ACTION
                        (
                           (2 | ((71) << 16)),
                           new MV.MVSB.MAP
                           ({
                              twRMCObjectIx        : MV.MVSB.MAP.FIELD.TWORD8,
                              abReserved_A         : MV.MVSB.MAP.FIELD.PAD (8),
                              twRPersonaIx         : MV.MVSB.MAP.FIELD.TWORD8,
                           })
                        ),

   BOUND:               new MV.MVSB.SERVICE.CLIENT.ACTION
                        (
                           (10 | ((71) << 16)),
                           new MV.MVSB.MAP
                           ({
                              twRMCObjectIx        : MV.MVSB.MAP.FIELD.TWORD8,
                              abReserved_A         : MV.MVSB.MAP.FIELD.PAD (8),
                              pBound               : MV.MVRP.Map.Class.RMCOMMON_BOUND_SB.MAP,
                           })
                        ),

   NAME:                new MV.MVSB.SERVICE.CLIENT.ACTION
                        (
                           (3 | ((71) << 16)),
                           new MV.MVSB.MAP
                           ({
                              twRMCObjectIx        : MV.MVSB.MAP.FIELD.TWORD8,
                              abReserved_A         : MV.MVSB.MAP.FIELD.PAD (8),
                              pName                : MV.MVRP.Map.Class.RMCOBJECT_NAME_SB.MAP,
                           })
                        ),

   ORBIT:               new MV.MVSB.SERVICE.CLIENT.ACTION
                        (
                           (8 | ((71) << 16)),
                           new MV.MVSB.MAP
                           ({
                              twRMCObjectIx        : MV.MVSB.MAP.FIELD.TWORD8,
                              abReserved_A         : MV.MVSB.MAP.FIELD.PAD (8),
                              pOrbit_Spin          : MV.MVRP.Map.Class.RMCOMMON_ORBIT_SPIN_SB.MAP,
                           })
                        ),

   OWNER:               new MV.MVSB.SERVICE.CLIENT.ACTION
                        (
                           (5 | ((71) << 16)),
                           new MV.MVSB.MAP
                           ({
                              twRMCObjectIx        : MV.MVSB.MAP.FIELD.TWORD8,
                              abReserved_A         : MV.MVSB.MAP.FIELD.PAD (8),
                              pOwner               : MV.MVRP.Map.Class.RMCOMMON_OWNER_SB.MAP,
                           })
                        ),

   PROPERTIES:          new MV.MVSB.SERVICE.CLIENT.ACTION
                        (
                           (11 | ((71) << 16)),
                           new MV.MVSB.MAP
                           ({
                              twRMCObjectIx        : MV.MVSB.MAP.FIELD.TWORD8,
                              abReserved_A         : MV.MVSB.MAP.FIELD.PAD (8),
                              pProperties          : MV.MVRP.Map.Class.RMCOBJECT_PROPERTIES_SB.MAP,
                           })
                        ),

   RESOURCE:            new MV.MVSB.SERVICE.CLIENT.ACTION
                        (
                           (6 | ((71) << 16)),
                           new MV.MVSB.MAP
                           ({
                              twRMCObjectIx        : MV.MVSB.MAP.FIELD.TWORD8,
                              abReserved_A         : MV.MVSB.MAP.FIELD.PAD (8),
                              pResource            : MV.MVRP.Map.Class.RMCOMMON_RESOURCE_SB.MAP,
                           })
                        ),

   RMCOBJECT_CLOSE:     new MV.MVSB.SERVICE.CLIENT.ACTION
                        (
                           (13 | ((71) << 16)),
                           new MV.MVSB.MAP
                           ({
                              twRMCObjectIx        : MV.MVSB.MAP.FIELD.TWORD8,
                              abReserved_A         : MV.MVSB.MAP.FIELD.PAD (8),
                              twRMCObjectIx_Close  : MV.MVSB.MAP.FIELD.TWORD8,
                           })
                        ),

   RMCOBJECT_OPEN:      new MV.MVSB.SERVICE.CLIENT.ACTION
                        (
                           (12 | ((71) << 16)),
                           new MV.MVSB.MAP
                           ({
                              twRMCObjectIx        : MV.MVSB.MAP.FIELD.TWORD8,
                              abReserved_A         : MV.MVSB.MAP.FIELD.PAD (16),
                              pName                : MV.MVRP.Map.Class.RMCOBJECT_NAME_SB.MAP,
                              pType                : MV.MVRP.Map.Class.RMCOMMON_TYPE_SB.MAP,
                              pOwner               : MV.MVRP.Map.Class.RMCOMMON_OWNER_SB.MAP,
                              pResource            : MV.MVRP.Map.Class.RMCOMMON_RESOURCE_SB.MAP,
                              pTransform           : MV.MVRP.Map.Class.RMCOMMON_TRANSFORM_SB.MAP,
                              pOrbit_Spin          : MV.MVRP.Map.Class.RMCOMMON_ORBIT_SPIN_SB.MAP,
                              pBound               : MV.MVRP.Map.Class.RMCOMMON_BOUND_SB.MAP,
                              pProperties          : MV.MVRP.Map.Class.RMCOBJECT_PROPERTIES_SB.MAP,
                              pCoord               : MV.MVRP.Class.DCOORD.MAP,
                           }),
                           new MV.MVSB.MAP
                           ({
                              twRMCObjectIx        : MV.MVSB.MAP.FIELD.TWORD8,
                           })
                        ),

   RMTOBJECT_OPEN:      new MV.MVSB.SERVICE.CLIENT.ACTION
                        (
                           (14 | ((71) << 16)),
                           new MV.MVSB.MAP
                           ({
                              twRMCObjectIx        : MV.MVSB.MAP.FIELD.TWORD8,
                              abReserved_A         : MV.MVSB.MAP.FIELD.PAD (16),
                              pName                : MV.MVRP.Map.Class.RMTOBJECT_NAME_SB.MAP,
                              pType                : MV.MVRP.Map.Class.RMCOMMON_TYPE_SB.MAP,
                              pOwner               : MV.MVRP.Map.Class.RMCOMMON_OWNER_SB.MAP,
                              pResource            : MV.MVRP.Map.Class.RMCOMMON_RESOURCE_SB.MAP,
                              pTransform           : MV.MVRP.Map.Class.RMCOMMON_TRANSFORM_SB.MAP,
                              pBound               : MV.MVRP.Map.Class.RMCOMMON_BOUND_SB.MAP,
                              pProperties          : MV.MVRP.Map.Class.RMTOBJECT_PROPERTIES_SB.MAP,
                              pCoord               : MV.MVRP.Class.DCOORD.MAP,
                           }),
                           new MV.MVSB.MAP
                           ({
                              twRMTObjectIx        : MV.MVSB.MAP.FIELD.TWORD8,
                           })
                        ),

   RMTOBJECT_CLOSE:     new MV.MVSB.SERVICE.CLIENT.ACTION
                        (
                           (15 | ((71) << 16)),
                           new MV.MVSB.MAP
                           ({
                              twRMCObjectIx        : MV.MVSB.MAP.FIELD.TWORD8,
                              abReserved_A         : MV.MVSB.MAP.FIELD.PAD (8),
                              twRMTObjectIx_Close  : MV.MVSB.MAP.FIELD.TWORD8,
                           })
                        ),

   SPIN:                new MV.MVSB.SERVICE.CLIENT.ACTION
                        (
                           (9 | ((71) << 16)),
                           new MV.MVSB.MAP
                           ({
                              twRMCObjectIx        : MV.MVSB.MAP.FIELD.TWORD8,
                              abReserved_A         : MV.MVSB.MAP.FIELD.PAD (8),
                              pOrbit_Spin          : MV.MVRP.Map.Class.RMCOMMON_ORBIT_SPIN_SB.MAP,
                           })
                        ),

   TRANSFORM:           new MV.MVSB.SERVICE.CLIENT.ACTION
                        (
                           (7 | ((71) << 16)),
                           new MV.MVSB.MAP
                           ({
                              twRMCObjectIx        : MV.MVSB.MAP.FIELD.TWORD8,
                              abReserved_A         : MV.MVSB.MAP.FIELD.PAD (8),
                              pTransform           : MV.MVRP.Map.Class.RMCOMMON_TRANSFORM_SB.MAP,
                              pCoord               : MV.MVRP.Class.DCOORD.MAP
                           })
                        ),

   TYPE:                new MV.MVSB.SERVICE.CLIENT.ACTION
                        (
                           (4 | ((71) << 16)),
                           new MV.MVSB.MAP
                           ({
                              twRMCObjectIx        : MV.MVSB.MAP.FIELD.TWORD8,
                              abReserved_A         : MV.MVSB.MAP.FIELD.PAD (8),
                              pType                : MV.MVRP.Map.Class.RMCOMMON_TYPE_SB.MAP
                           })
                        )
};

MV.MVRP.Map.SB_RMTOBJECT = class extends MV.MVSB.SB_OBJECT
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVSB',
         'RMTObject',

         72,

         MV.MVRP.Map.SB_RMTOBJECT.apAction,

         true,

         new MV.MVSB.MAP
         ({
            pName                   : MV.MVRP.Map.Class.RMTOBJECT_NAME_SB.MAP,
            pType                   : MV.MVRP.Map.Class.RMCOMMON_TYPE_SB.MAP,
            pOwner                  : MV.MVRP.Map.Class.RMCOMMON_OWNER_SB.MAP,
            pResource               : MV.MVRP.Map.Class.RMCOMMON_RESOURCE_SB.MAP,
            pTransform              : MV.MVRP.Map.Class.RMCOMMON_TRANSFORM_SB.MAP,
            pOrbit_Spin             : MV.MVRP.Map.Class.RMCOMMON_ORBIT_SPIN_SB.PAD,
            pBound                  : MV.MVRP.Map.Class.RMCOMMON_BOUND_SB.MAP,
            pProperties             : MV.MVRP.Map.Class.RMTOBJECT_PROPERTIES_SB.MAP,

                                      wSize_Partial: [MV.MVSB.MAP.FIELD.eTYPE.SIZE, 0, "Partial"],

            abReserved_A            : MV.MVSB.MAP.FIELD.PAD (128),
         })
      );
   }

}

MV.MVRP.Map.SB_RMTOBJECT.FACTORY = class extends MV.MVSB.SB_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVRP.Map.SB_RMTOBJECT (this.pReference, this.pMap, pClient);
   }
}

MV.MVRP.Map.SB_RMTOBJECT.apAction =
{
   CAPTURE :            new MV.MVSB.SERVICE.CLIENT.ACTION
                        (
                           (1 | ((72) << 16)),
                           new MV.MVSB.MAP
                           ({
                              twRMTObjectIx                    : MV.MVSB.MAP.FIELD.TWORD8,
                              abReserved_A                     : MV.MVSB.MAP.FIELD.PAD (8),
                              twRPersonaIx                     : MV.MVSB.MAP.FIELD.TWORD8,
                           })
                        ),

   RELEASE :            new MV.MVSB.SERVICE.CLIENT.ACTION
                        (
                           (2 | ((72) << 16)),
                           new MV.MVSB.MAP
                           ({
                              twRMTObjectIx                    : MV.MVSB.MAP.FIELD.TWORD8,
                              abReserved_A                     : MV.MVSB.MAP.FIELD.PAD (8),
                              twRPersonaIx                     : MV.MVSB.MAP.FIELD.TWORD8,
                           })
                        ),

   NAME :               new MV.MVSB.SERVICE.CLIENT.ACTION
                        (
                           (3 | ((72) << 16)),
                           new MV.MVSB.MAP
                           ({
                              twRMTObjectIx                    : MV.MVSB.MAP.FIELD.TWORD8,
                              abReserved_A                     : MV.MVSB.MAP.FIELD.PAD (8),
                              pName                            : MV.MVRP.Map.Class.RMTOBJECT_NAME_SB.MAP,
                           })
                        ),

   TYPE :               new MV.MVSB.SERVICE.CLIENT.ACTION
                        (
                           (4 | ((72) << 16)),
                           new MV.MVSB.MAP
                           ({
                              twRMTObjectIx                    : MV.MVSB.MAP.FIELD.TWORD8,
                              abReserved_A                     : MV.MVSB.MAP.FIELD.PAD (8),
                              pType                            : MV.MVRP.Map.Class.RMCOMMON_TYPE_SB.MAP,
                           })
                        ),

   OWNER :              new MV.MVSB.SERVICE.CLIENT.ACTION
                        (
                           (5 | ((72) << 16)),
                           new MV.MVSB.MAP
                           ({
                              twRMTObjectIx                    : MV.MVSB.MAP.FIELD.TWORD8,
                              abReserved_A                     : MV.MVSB.MAP.FIELD.PAD (8),
                              pOwner                           : MV.MVRP.Map.Class.RMCOMMON_OWNER_SB.MAP,
                           })
                        ),

   RESOURCE :           new MV.MVSB.SERVICE.CLIENT.ACTION
                        (
                           (6 | ((72) << 16)),
                           new MV.MVSB.MAP
                           ({
                              twRMTObjectIx                    : MV.MVSB.MAP.FIELD.TWORD8,
                              abReserved_A                     : MV.MVSB.MAP.FIELD.PAD (8),
                              pResource                        : MV.MVRP.Map.Class.RMCOMMON_RESOURCE_SB.MAP,
                           })
                        ),

   TRANSFORM :          new MV.MVSB.SERVICE.CLIENT.ACTION
                        (
                           (7 | ((72) << 16)),
                           new MV.MVSB.MAP
                           ({
                              twRMTObjectIx                    : MV.MVSB.MAP.FIELD.TWORD8,
                              abReserved_A                     : MV.MVSB.MAP.FIELD.PAD (8),
                              pTransform                       : MV.MVRP.Map.Class.RMCOMMON_TRANSFORM_SB.MAP,
                              pCoord                           : MV.MVRP.Class.DCOORD.MAP
                           })
                        ),

   BOUND :              new MV.MVSB.SERVICE.CLIENT.ACTION
                        (
                           (8 | ((72) << 16)),
                           new MV.MVSB.MAP
                           ({
                              twRMTObjectIx                    : MV.MVSB.MAP.FIELD.TWORD8,
                              abReserved_A                     : MV.MVSB.MAP.FIELD.PAD (8),
                              pBound                           : MV.MVRP.Map.Class.RMCOMMON_BOUND_SB.MAP,
                           })
                        ),

   PROPERTIES :         new MV.MVSB.SERVICE.CLIENT.ACTION
                        (
                           (9 | ((72) << 16)),
                           new MV.MVSB.MAP
                           ({
                              twRMTObjectIx                    : MV.MVSB.MAP.FIELD.TWORD8,
                              abReserved_A                     : MV.MVSB.MAP.FIELD.PAD (8),
                              pProperties                      : MV.MVRP.Map.Class.RMTOBJECT_PROPERTIES_SB.MAP,
                           })
                        ),

   RMTOBJECT_OPEN :     new MV.MVSB.SERVICE.CLIENT.ACTION
                        (
                           (10 | ((72) << 16)),
                           new MV.MVSB.MAP
                           ({
                              twRMTObjectIx                    : MV.MVSB.MAP.FIELD.TWORD8,
                              abReserved_A                     : MV.MVSB.MAP.FIELD.PAD (16),
                              pName                            : MV.MVRP.Map.Class.RMTOBJECT_NAME_SB.MAP,
                              pType                            : MV.MVRP.Map.Class.RMCOMMON_TYPE_SB.MAP,
                              pOwner                           : MV.MVRP.Map.Class.RMCOMMON_OWNER_SB.MAP,
                              pResource                        : MV.MVRP.Map.Class.RMCOMMON_RESOURCE_SB.MAP,
                              pTransform                       : MV.MVRP.Map.Class.RMCOMMON_TRANSFORM_SB.MAP,
                              pBound                           : MV.MVRP.Map.Class.RMCOMMON_BOUND_SB.MAP,
                              pProperties                      : MV.MVRP.Map.Class.RMTOBJECT_PROPERTIES_SB.MAP,
                              pCoord                           : MV.MVRP.Class.DCOORD.MAP,
                           }),
                           new MV.MVSB.MAP
                           ({
                              twRMTObjectIx                    : MV.MVSB.MAP.FIELD.TWORD8,
                           })
                        ),

   RMTOBJECT_CLOSE :    new MV.MVSB.SERVICE.CLIENT.ACTION
                        (
                           (11 | ((72) << 16)),
                           new MV.MVSB.MAP
                           ({
                              twRMTObjectIx                    : MV.MVSB.MAP.FIELD.TWORD8,
                              abReserved_A                     : MV.MVSB.MAP.FIELD.PAD (8),
                              twRMTObjectIx_Close              : MV.MVSB.MAP.FIELD.TWORD8,
                           })
                        ),

   RMPOBJECT_OPEN :     new MV.MVSB.SERVICE.CLIENT.ACTION
                        (
                           (12 | ((72) << 16)),
                           new MV.MVSB.MAP
                           ({
                              twRMTObjectIx                    : MV.MVSB.MAP.FIELD.TWORD8,
                              abReserved_A                     : MV.MVSB.MAP.FIELD.PAD (16),
                              pName                            : MV.MVRP.Map.Class.RMPOBJECT_NAME_SB.MAP,
                              pType                            : MV.MVRP.Map.Class.RMCOMMON_TYPE_SB.MAP,
                              pOwner                           : MV.MVRP.Map.Class.RMCOMMON_OWNER_SB.MAP,
                              pResource                        : MV.MVRP.Map.Class.RMCOMMON_RESOURCE_SB.MAP,
                              pTransform                       : MV.MVRP.Map.Class.RMCOMMON_TRANSFORM_SB.MAP,
                              pBound                           : MV.MVRP.Map.Class.RMCOMMON_BOUND_SB.MAP
                           }),
                           new MV.MVSB.MAP
                           ({
                              twRMPObjectIx                    : MV.MVSB.MAP.FIELD.TWORD8,
                           })
                        ),

   RMPOBJECT_CLOSE :    new MV.MVSB.SERVICE.CLIENT.ACTION
                        (
                           (13 | ((72) << 16)),
                           new MV.MVSB.MAP
                           ({
                              twRMTObjectIx                    : MV.MVSB.MAP.FIELD.TWORD8,
                              abReserved_A                     : MV.MVSB.MAP.FIELD.PAD (8),
                              twRMPObjectIx                    : MV.MVSB.MAP.FIELD.TWORD8,
                           })
                        )
}

MV.MVRP.Map.SB_RMPOBJECT = class extends MV.MVSB.SB_OBJECT
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVSB',
         'RMPObject',

         73,

         MV.MVRP.Map.SB_RMPOBJECT.apAction,

         true,

         new MV.MVSB.MAP
         ({
            pName                   : MV.MVRP.Map.Class.RMPOBJECT_NAME_SB.MAP,
            pType                   : MV.MVRP.Map.Class.RMCOMMON_TYPE_SB.MAP,
            pOwner                  : MV.MVRP.Map.Class.RMCOMMON_OWNER_SB.MAP,
            pResource               : MV.MVRP.Map.Class.RMCOMMON_RESOURCE_SB.MAP,
            pTransform              : MV.MVRP.Map.Class.RMCOMMON_TRANSFORM_SB.MAP,
            pOrbit_Spin             : MV.MVRP.Map.Class.RMCOMMON_ORBIT_SPIN_SB.PAD,
            pBound                  : MV.MVRP.Map.Class.RMCOMMON_BOUND_SB.MAP,
            pProperties             : MV.MVRP.Map.Class.RMPOBJECT_PROPERTIES_SB.PAD,

                                      wSize_Partial: [MV.MVSB.MAP.FIELD.eTYPE.SIZE, 0, "Partial"],
         })
      );
   }

}

MV.MVRP.Map.SB_RMPOBJECT.FACTORY = class extends MV.MVSB.SB_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVRP.Map.SB_RMPOBJECT (this.pReference, this.pMap, pClient);
   }
}

MV.MVRP.Map.SB_RMPOBJECT.apAction =
{
   CAPTURE :         new MV.MVSB.SERVICE.CLIENT.ACTION
                     (
                        (1 | ((73) << 16)),
                        new MV.MVSB.MAP
                        ({
                           twRMPObjectIx                    : MV.MVSB.MAP.FIELD.TWORD8,
                           abReserved_A                     : MV.MVSB.MAP.FIELD.PAD (8),
                           twRPersonaIx                     : MV.MVSB.MAP.FIELD.TWORD8,
                        })
                     ),

   RELEASE :         new MV.MVSB.SERVICE.CLIENT.ACTION
                     (
                        (2 | ((73) << 16)),
                        new MV.MVSB.MAP
                        ({
                           twRMPObjectIx                    : MV.MVSB.MAP.FIELD.TWORD8,
                           abReserved_A                     : MV.MVSB.MAP.FIELD.PAD (8),
                           twRPersonaIx                     : MV.MVSB.MAP.FIELD.TWORD8,
                        })
                     ),

   NAME :            new MV.MVSB.SERVICE.CLIENT.ACTION
                     (
                        (3 | ((73) << 16)),
                        new MV.MVSB.MAP
                        ({
                           twRMPObjectIx                    : MV.MVSB.MAP.FIELD.TWORD8,
                           abReserved_A                     : MV.MVSB.MAP.FIELD.PAD (8),
                           pName                            : MV.MVRP.Map.Class.RMPOBJECT_NAME_SB.MAP,
                        })
                     ),

   TYPE :            new MV.MVSB.SERVICE.CLIENT.ACTION
                     (
                        (4 | ((73) << 16)),
                        new MV.MVSB.MAP
                        ({
                           twRMPObjectIx                    : MV.MVSB.MAP.FIELD.TWORD8,
                           abReserved_A                     : MV.MVSB.MAP.FIELD.PAD (8),
                           pType                            : MV.MVRP.Map.Class.RMCOMMON_TYPE_SB.MAP,
                        })
                     ),

   OWNER :           new MV.MVSB.SERVICE.CLIENT.ACTION
                     (
                        (5 | ((73) << 16)),
                        new MV.MVSB.MAP
                        ({
                           twRMPObjectIx                    : MV.MVSB.MAP.FIELD.TWORD8,
                           abReserved_A                     : MV.MVSB.MAP.FIELD.PAD (8),
                           pOwner                           : MV.MVRP.Map.Class.RMCOMMON_OWNER_SB.MAP,
                        })
                     ),

   RESOURCE :        new MV.MVSB.SERVICE.CLIENT.ACTION
                     (
                        (6 | ((73) << 16)),
                        new MV.MVSB.MAP
                        ({
                           twRMPObjectIx                    : MV.MVSB.MAP.FIELD.TWORD8,
                           abReserved_A                     : MV.MVSB.MAP.FIELD.PAD (8),
                           pResource                        : MV.MVRP.Map.Class.RMCOMMON_RESOURCE_SB.MAP,
                        })
                     ),

   TRANSFORM :       new MV.MVSB.SERVICE.CLIENT.ACTION
                     (
                        (7 | ((73) << 16)),
                        new MV.MVSB.MAP
                        ({
                           twRMPObjectIx                    : MV.MVSB.MAP.FIELD.TWORD8,
                           abReserved_A                     : MV.MVSB.MAP.FIELD.PAD (8),
                           pTransform                       : MV.MVRP.Map.Class.RMCOMMON_TRANSFORM_SB.MAP,
                        })
                     ),

   BOUND :           new MV.MVSB.SERVICE.CLIENT.ACTION
                     (
                        (8 | ((73) << 16)),
                        new MV.MVSB.MAP
                        ({
                           twRMPObjectIx                    : MV.MVSB.MAP.FIELD.TWORD8,
                           abReserved_A                     : MV.MVSB.MAP.FIELD.PAD (8),
                           pBound                           : MV.MVRP.Map.Class.RMCOMMON_BOUND_SB.MAP,
                        })
                     ),

   RMPOBJECT_OPEN :  new MV.MVSB.SERVICE.CLIENT.ACTION
                     (
                        (10 | ((73) << 16)),
                        new MV.MVSB.MAP
                        ({
                           twRMPObjectIx                    : MV.MVSB.MAP.FIELD.TWORD8,
                           abReserved_A                     : MV.MVSB.MAP.FIELD.PAD (16),
                           pName                            : MV.MVRP.Map.Class.RMPOBJECT_NAME_SB.MAP,
                           pType                            : MV.MVRP.Map.Class.RMCOMMON_TYPE_SB.MAP,
                           pOwner                           : MV.MVRP.Map.Class.RMCOMMON_OWNER_SB.MAP,
                           pResource                        : MV.MVRP.Map.Class.RMCOMMON_RESOURCE_SB.MAP,
                           pTransform                       : MV.MVRP.Map.Class.RMCOMMON_TRANSFORM_SB.MAP,
                           pBound                           : MV.MVRP.Map.Class.RMCOMMON_BOUND_SB.MAP,
                        }),
                        new MV.MVSB.MAP
                        ({
                           twRMPObjectIx                    : MV.MVSB.MAP.FIELD.TWORD8,
                        })
                     ),

   RMPOBJECT_CLOSE : new MV.MVSB.SERVICE.CLIENT.ACTION
                     (
                        (11 | ((73) << 16)),
                        new MV.MVSB.MAP
                        ({
                           twRMPObjectIx                    : MV.MVSB.MAP.FIELD.TWORD8,
                           abReserved_A                     : MV.MVSB.MAP.FIELD.PAD (8),
                           twRMPObjectIx_Close              : MV.MVSB.MAP.FIELD.TWORD8,
                        })
                     ),
};

MV.MVRP.Map.REST_OBJECT = class extends MV.MVRest.REST_OBJECT
{

   Response (pIAction)
   {
      let pResponse = pIAction.pResponse;

      let pObjectHead, pObject;

      if (pResponse.nResult == 0)
      {
         pObjectHead = pResponse.Parent.pObjectHead;

         if ((pObject = (this.pClient.pMem.ObjectBank (pObjectHead.wClass_Object)).Get (null, pObjectHead.twObjectIx)) != null)
         {
            pObject.Recovering (pObjectHead.wClass_Object);

            this.pClient.Object_Recover (pResponse.Parent);

            if (pResponse.aChild.length > 0)
            {
               pObject.Recovering (pResponse.aChild[0].pObjectHead.wClass_Object);

               for (let i=0; i < pResponse.aChild.length; i++)
               {
                  this.pClient.Object_Recover (pResponse.aChild[i]);
               }

               pObject.Recovered (pResponse.aChild[0].pObjectHead.wClass_Object);
            }

            pObject.Recovered (pObjectHead.wClass_Object);
         }
      }

      pIAction.destructor ();
   }
}

MV.MVRP.Map.REST_RMROOT = class extends MV.MVRP.Map.REST_OBJECT
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVRest',
         'RMRoot',

         70,

         MV.MVRP.Map.REST_RMROOT.apAction,

         true
      );
   }

   Map_Read (pModel)
   {
      this.pModel.pName .Set (this.pData.pName .wsRMRootId);
      this.pModel.pOwner.Set (this.pData.pOwner.twRPersonaIx);
   }

   Attach ()
   {
      if (super.Attach () != false)
      {
         let pIAction = this.Request ('UPDATE');
         let pRequest = pIAction.pRequest;

         pRequest.twRMRootIx = this.pModel.twRMRootIx;

         pIAction.Send (this, this.Response);
      }
   }
}

MV.MVRP.Map.REST_RMROOT.FACTORY = class extends MV.MVRest.REST_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVRP.Map.REST_RMROOT (this.pReference, pClient);
   }
}

MV.MVRP.Map.REST_RMROOT.apAction = {};

MV.MVRP.Map.REST_RMROOT.apAction['UPDATE'] = new MV.MVRest.SERVICE.CLIENT.ACTION
(
   'rmroot/update',
   {
      twRMRootIx     : 0

   },
   MV.MVRest.POST_JSON
);

MV.MVRP.Map.REST_RMCOBJECT = class extends MV.MVRP.Map.REST_OBJECT
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVRest',
         'RMCObject',

         71,

         MV.MVRP.Map.REST_RMCOBJECT.apAction,

         true
      );
   }

   Map_Read (pModel)
   {
      this.pModel.pName                .Set (this.pData.pName.wsRMCObjectId);
      this.pModel.pType                .Set (this.pData.pType.bType, this.pData.pType.bSubtype, this.pData.pType.bFiction);
      this.pModel.pOwner               .Set (this.pData.pOwner.twRPersonaIx);
      this.pModel.pResource            .Set (this.pData.pResource.qwResource, this.pData.pResource.sName, this.pData.pResource.sReference);
      this.pModel.pTransform .vPosition.Set (this.pData.pTransform.Position[0], this.pData.pTransform.Position[1], this.pData.pTransform.Position[2]);
      this.pModel.pTransform .qRotation.Set (this.pData.pTransform.Rotation[0], this.pData.pTransform.Rotation[1], this.pData.pTransform.Rotation[2], this.pData.pTransform.Rotation[3]);
      this.pModel.pTransform .vScale   .Set (this.pData.pTransform.Scale   [0], this.pData.pTransform.Scale   [1], this.pData.pTransform.Scale   [2]);
      this.pModel.pOrbit_Spin          .Set (this.pData.pOrbit_Spin.tmPeriod, this.pData.pOrbit_Spin.tmStart, this.pData.pOrbit_Spin.dA, this.pData.pOrbit_Spin.dB);
      this.pModel.pBound               .Set (this.pData.pBound.Max[0], this.pData.pBound.Max[1], this.pData.pBound.Max[2]);
      this.pModel.pProperties          .Set (this.pData.pProperties.fMass, this.pData.pProperties.fGravity, this.pData.pProperties.fColor, this.pData.pProperties.fBrightness, this.pData.pProperties.fReflectivity);
      this.pModel.nChildren               =  this.pData.nChildren;
   }

   Attach ()
   {
      if (super.Attach () != false)
      {
         let pIAction = this.Request ('UPDATE');
         let pRequest = pIAction.pRequest;

         pRequest.twRMCObjectIx = this.pModel.twRMCObjectIx;

         pIAction.Send (this, this.Response);
      }
   }
}

MV.MVRP.Map.REST_RMCOBJECT.FACTORY = class extends MV.MVRest.REST_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVRP.Map.REST_RMCOBJECT (this.pReference, pClient);
   }
}

MV.MVRP.Map.REST_RMCOBJECT.apAction = {};

MV.MVRP.Map.REST_RMCOBJECT.apAction['UPDATE'] = new MV.MVRest.SERVICE.CLIENT.ACTION
(
   'rmcobject/update',
   {
      twRMCObjectIx : 0,

   },
   MV.MVRest.POST_JSON
);

MV.MVRP.Map.REST_RMCOBJECT.apAction['SEARCH'] = new MV.MVRest.SERVICE.CLIENT.ACTION
(
   'rmcobject/search',
   {
      twRMCObjectIx : 0,
      dX            : 0,
      dY            : 0,
      dZ            : 0,
      sText         : '',
   },
   MV.MVRest.POST_JSON
);

MV.MVRP.Map.REST_RMTOBJECT = class extends MV.MVRP.Map.REST_OBJECT
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVRest',
         'RMTObject',

         72,

         MV.MVRP.Map.REST_RMTOBJECT.apAction,

         true
      );
   }

   Map_Read (pModel)
   {
      this.pModel.pName                .Set (this.pData.pName.wsRMTObjectId);
      this.pModel.pType                .Set (this.pData.pType.bType, this.pData.pType.bSubtype, this.pData.pType.bFiction);
      this.pModel.pOwner               .Set (this.pData.pOwner.twRPersonaIx);
      this.pModel.pResource            .Set (this.pData.pResource.qwResource, this.pData.pResource.sName, this.pData.pResource.sReference);
      this.pModel.pTransform .vPosition.Set (this.pData.pTransform.Position[0], this.pData.pTransform.Position[1], this.pData.pTransform.Position[2]);
      this.pModel.pTransform .qRotation.Set (this.pData.pTransform.Rotation[0], this.pData.pTransform.Rotation[1], this.pData.pTransform.Rotation[2], this.pData.pTransform.Rotation[3]);
      this.pModel.pTransform .vScale   .Set (this.pData.pTransform.Scale   [0], this.pData.pTransform.Scale   [1], this.pData.pTransform.Scale   [2]);
      this.pModel.pBound               .Set (this.pData.pBound.Max[0], this.pData.pBound.Max[1], this.pData.pBound.Max[2]);
      this.pModel.pProperties          .Set (this.pData.pProperties.bLockToGround, this.pData.pProperties.bYouth, this.pData.pProperties.bAdult, this.pData.pProperties.bAvatar);
      this.pModel.nChildren               =  this.pData.nChildren;
   }

   Attach ()
   {
      if (super.Attach () != false)
      {
         let pIAction = this.Request ('UPDATE');
         let pRequest = pIAction.pRequest;

         pRequest.twRMTObjectIx = this.pModel.twRMTObjectIx;

         pIAction.Send (this, this.Response);
      }
   }
}

MV.MVRP.Map.REST_RMTOBJECT.FACTORY = class extends MV.MVRest.REST_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVRP.Map.REST_RMTOBJECT (this.pReference, pClient);
   }
}

MV.MVRP.Map.REST_RMTOBJECT.apAction = {};

MV.MVRP.Map.REST_RMTOBJECT.apAction['UPDATE'] = new MV.MVRest.SERVICE.CLIENT.ACTION
(
   'rmtobject/update',
   {
      twRMTObjectIx  : 0

   },
   MV.MVRest.POST_JSON
);

MV.MVRP.Map.REST_RMTOBJECT.apAction['SEARCH'] = new MV.MVRest.SERVICE.CLIENT.ACTION
(
   'rmtobject/search',
   {
      twRMTObjectIx : 0,
      dX            : 0,
      dY            : 0,
      dZ            : 0,
      sText         : '',
   },
   MV.MVRest.POST_JSON
);

MV.MVRP.Map.REST_RMPOBJECT = class extends MV.MVRP.Map.REST_OBJECT
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVRest',
         'RMPObject',

         73,

         MV.MVRP.Map.REST_RMPOBJECT.apAction,

         true
      );
   }

   Map_Read (pModel)
   {
      this.pModel.pName                .Set (this.pData.pName.wsRMPObjectId);
      this.pModel.pType                .Set (this.pData.pType.bType, this.pData.pType.bSubtype, this.pData.pType.bFiction, this.pData.pType.bMovable);
      this.pModel.pOwner               .Set (this.pData.pOwner.twRPersonaIx);
      this.pModel.pResource            .Set (this.pData.pResource.qwResource, this.pData.pResource.sName, this.pData.pResource.sReference);
      this.pModel.pTransform .vPosition.Set (this.pData.pTransform.Position[0], this.pData.pTransform.Position[1], this.pData.pTransform.Position[2]);
      this.pModel.pTransform .qRotation.Set (this.pData.pTransform.Rotation[0], this.pData.pTransform.Rotation[1], this.pData.pTransform.Rotation[2], this.pData.pTransform.Rotation[3]);
      this.pModel.pTransform .vScale   .Set (this.pData.pTransform.Scale   [0], this.pData.pTransform.Scale   [1], this.pData.pTransform.Scale   [2]);
      this.pModel.pBound               .Set (this.pData.pBound.Max[0], this.pData.pBound.Max[1], this.pData.pBound.Max[2]);
      this.pModel.nChildren               =  this.pData.nChildren;
   }

   Attach ()
   {
      if (super.Attach () != false)
      {
         let pIAction = this.Request ('UPDATE');
         let pRequest = pIAction.pRequest;

         pRequest.twRMPObjectIx = this.pModel.twRMPObjectIx;

         pIAction.Send (this, this.Response);
      }
   }
}

MV.MVRP.Map.REST_RMPOBJECT.FACTORY = class extends MV.MVRest.REST_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVRP.Map.REST_RMPOBJECT (this.pReference, pClient);
   }
}

MV.MVRP.Map.REST_RMPOBJECT.apAction = {};

MV.MVRP.Map.REST_RMPOBJECT.apAction['UPDATE'] = new MV.MVRest.SERVICE.CLIENT.ACTION
(
   'rmpobject/update',
   {
      twRMPObjectIx  : 0

   },
   MV.MVRest.POST_JSON
);

MV.MVRP.Map.IO_OBJECT = class extends MV.MVIO.IO_OBJECT
{

   Response (pIAction)
   {
      let pResponse = pIAction.pResponse;

      let pObjectHead, pObject;

      pIAction.dwResult = pResponse.nResult;

      if (pResponse.nResult == 0)
      {
         pObjectHead = pResponse.Parent.pObjectHead;

         if ((pObject = (this.pClient.pMem.ObjectBank (pObjectHead.wClass_Object)).Get (null, pObjectHead.twObjectIx)) != null)
         {
            pObject.Recovering ();

            this.pClient.Object_Recover (pResponse.Parent);

            for (let i=0; i < pResponse.aChild.length; i++)
            {
               if (pResponse.aChild[i].length > 0)
               {
                  for (let j=0; j < pResponse.aChild[i].length; j++)
                  {
                     this.pClient.Object_Recover (pResponse.aChild[i][j]);
                  }
               }
            }

            pObject.Recovered ();
         }
      }

      pIAction.destructor ();
   }
}

MV.MVRP.Map.Class.RMCOMMON_BOUND_IO = class extends MV.MVRP.Map.Class.RMCOMMON_BOUND
{
   static MAP  =
   {
      vObject         : { dX: 0, dY: 0, dZ: 0 },
   };

   static Convert (pRequest_Out, pRequest_In)
   {
      pRequest_Out.Bound_dX      = pRequest_In.pBound.dX;
      pRequest_Out.Bound_dY      = pRequest_In.pBound.dY;
      pRequest_Out.Bound_dZ      = pRequest_In.pBound.dZ;
   }
}

MV.MVRP.Map.Class.RMCOMMON_TRANSFORM_IO = class extends MV.MVRP.Map.Class.RMCOMMON_TRANSFORM
{
   static MAP  =
   {
      vPosition : { dX: 0, dY: 0, dZ: 0        },
      qRotation : { dX: 0, dY: 0, dZ: 0, dW: 0 },
      vScale    : { dX: 0, dY: 0, dZ: 0        }
   };

   static Convert (pRequest_Out, pRequest_In)
   {
      pRequest_Out.Transform_Position_dX = pRequest_In.pTransform.vPosition.dX;
      pRequest_Out.Transform_Position_dY = pRequest_In.pTransform.vPosition.dY;
      pRequest_Out.Transform_Position_dZ = pRequest_In.pTransform.vPosition.dZ;

      pRequest_Out.Transform_Rotation_dX = pRequest_In.pTransform.qRotation.dX;
      pRequest_Out.Transform_Rotation_dY = pRequest_In.pTransform.qRotation.dY;
      pRequest_Out.Transform_Rotation_dZ = pRequest_In.pTransform.qRotation.dZ;
      pRequest_Out.Transform_Rotation_dW = pRequest_In.pTransform.qRotation.dW;

      pRequest_Out.Transform_Scale_dX    = pRequest_In.pTransform.vScale.dX;
      pRequest_Out.Transform_Scale_dY    = pRequest_In.pTransform.vScale.dY;
      pRequest_Out.Transform_Scale_dZ    = pRequest_In.pTransform.vScale.dZ;
   }
};

MV.MVRP.Map.Class.RMCOMMON_ORBIT_SPIN_IO = class extends MV.MVRP.Map.Class.RMCOMMON_ORBIT_SPIN
{
   static MAP =
   {
      tmPeriod          : 0,
      tmOrigin          : 0,
      dA                : 0,
      dB                : 0
   };

   static Convert (pRequest_Out, pRequest_In)
   {
      pRequest_Out.Orbit_Spin_tmPeriod = pRequest_In.pOrbit_Spin.tmPeriod;
      pRequest_Out.Orbit_Spin_tmStart  = pRequest_In.pOrbit_Spin.tmStart;
      pRequest_Out.Orbit_Spin_dA       = pRequest_In.pOrbit_Spin.dA;
      pRequest_Out.Orbit_Spin_dB       = pRequest_In.pOrbit_Spin.dB;
   };
}

MV.MVRP.Map.Class.RMCOMMON_OWNER_IO = class extends MV.MVRP.Map.Class.RMCOMMON_OWNER
{
   static MAP =
   {
      twRPersonaIx      : 0
   };

   static Convert (pRequest_Out, pRequest_In)
   {
      pRequest_Out.Owner_twRPersonaIx = pRequest_In.pOwner.twRPersonaIx;
   };
}

MV.MVRP.Map.Class.RMCOMMON_TYPE_IO = class extends MV.MVRP.Map.Class.RMCOMMON_TYPE
{
   static MAP =
   {
      bType:         0,
      bSubtype:      0,
      bFiction:      0,
      bMovable:      0
   };

   static Convert (pRequest_Out, pRequest_In)
   {
      pRequest_Out.Type_bType    = pRequest_In.pType.bType;
      pRequest_Out.Type_bSubtype = pRequest_In.pType.bSubtype;
      pRequest_Out.Type_bFiction = pRequest_In.pType.bFiction;
      pRequest_Out.Type_bMovable = pRequest_In.pType.bMovable;
   }
}

MV.MVRP.Map.Class.RMCOMMON_RESOURCE_IO = class extends MV.MVRP.Map.Class.RMCOMMON_RESOURCE
{
   static MAP =
   {
      qwResource:    0,
      sName:         '',
      sReference:    ''
   };

   static Convert (pRequest_Out, pRequest_In)
   {
      pRequest_Out.Resource_qwResource = pRequest_In.pResource.qwResource;
      pRequest_Out.Resource_sName      = pRequest_In.pResource.sName;
      pRequest_Out.Resource_sReference = pRequest_In.pResource.sReference;
   }
}

MV.MVRP.Map.Class.DCOORD_IO = class extends MV.MVRP.Class.DCOORD
{
   static MAP =
   {
      bCoord            : 0,
      dA                : 0,
      dB                : 0,
      dC                : 0
   };

   static Convert (pRequest_Out, pRequest_In)
   {
      pRequest_Out.bCoord   = pRequest_In.pCoord.bCoord;
      pRequest_Out.dA       = pRequest_In.pCoord.dA;
      pRequest_Out.dB       = pRequest_In.pCoord.dB;
      pRequest_Out.dC       = pRequest_In.pCoord.dC;
   };
}

MV.MVRP.Map.Class.RMCOBJECT_NAME_IO = class extends MV.MVRP.Map.Class.RMCOBJECT_NAME
{
   static MAP =
   {
      wsRMCObjectId     : ''
   };

   static Convert (pRequest_Out, pRequest_In)
   {
      pRequest_Out.Name_wsRMCObjectId = pRequest_In.pName.wsRMCObjectId;
   }
}

MV.MVRP.Map.Class.RMCOBJECT_PROPERTIES_IO = class extends MV.MVRP.Map.Class.RMCOBJECT_PROPERTIES
{
   static MAP =
   {
      fMass:         0.0,
      fGravity:      0.0,
      fColor:        0.0,
      fBrightness:   0.0,
      fReflectivity: 0.0
   };

   static Convert (pRequest_Out, pRequest_In)
   {
      pRequest_Out.Properties_fMass         = pRequest_In.pProperties.fMass;
      pRequest_Out.Properties_fGravity      = pRequest_In.pProperties.fGravity;
      pRequest_Out.Properties_fColor        = pRequest_In.pProperties.fColor;
      pRequest_Out.Properties_fBrightness   = pRequest_In.pProperties.fBrightness;
      pRequest_Out.Properties_fReflectivity = pRequest_In.pProperties.fReflectivity;
   }
}

MV.MVRP.Map.Class.RMTOBJECT_NAME_IO = class extends MV.MVRP.Map.Class.RMTOBJECT_NAME
{
   static MAP =
   {
      wsRMTObjectId: ''
   };

   static Convert (pRequest_Out, pRequest_In)
   {
      pRequest_Out.Name_wsRMTObjectId       = pRequest_In.pName.wsRMTObjectId;
   }
}

MV.MVRP.Map.Class.RMTOBJECT_PROPERTIES_IO = class extends MV.MVRP.Map.Class.RMTOBJECT_PROPERTIES
{
   static MAP =
   {
      bLockToGround: 0,
      bYouth:        0,
      bAdult:        0,
      bAvatar:       0,
   };

   static Convert (pRequest_Out, pRequest_In)
   {
      pRequest_Out.Properties_bLockToGround = pRequest_In.pProperties.bLockToGround;
      pRequest_Out.Properties_bYouth        = pRequest_In.pProperties.bYouth;
      pRequest_Out.Properties_bAdult        = pRequest_In.pProperties.bAdult;
      pRequest_Out.Properties_bAvatar       = pRequest_In.pProperties.bAvatar;
   }
}

MV.MVRP.Map.Class.RMPOBJECT_NAME_IO = class extends MV.MVRP.Map.Class.RMPOBJECT_NAME
{
   static MAP =
   {
      wsRMPObjectId: ''
   };

   static Convert (pRequest_Out, pRequest_In)
   {
      pRequest_Out.Name_wsRMPObjectId       = pRequest_In.pName.wsRMPObjectId;
   }
}

MV.MVRP.Map.Class.RMROOT_NAME_IO = class extends MV.MVRP.Map.Class.RMROOT_NAME
{
   static MAP =
   {
      wsRMRootId        : ''
   };

   static Convert (pRequest_Out, pRequest_In)
   {
      pRequest_Out.Name_wsRMRootId           = pRequest_In.pName.wsRMRootId;
   }
}

MV.MVRP.Map.IO_RMROOT = class extends MV.MVRP.Map.IO_OBJECT
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVIO',
         'RMRoot',

         70,

         MV.MVRP.Map.IO_RMROOT.apAction,

         true
      );
   }

   Map_Read (pModel)
   {
      this.pModel.pName .Set (this.pData.pName .wsRMRootId);
      this.pModel.pOwner.Set (this.pData.pOwner.twRPersonaIx);
   }

   Attach (bSubscribe)
   {
      let bResult = true;

      if (bSubscribe)
      {
         bResult = super.Attach ();
      }
      else
      {
         let pIAction = this.Request ('UPDATE');
         let pRequest = pIAction.pRequest;

         pRequest.twRMRootIx = this.pModel.twRMRootIx;

         pIAction.Send (this, this.Response);
      }

      return bResult;
   }

   Detach (bSubscribe)
   {
      let bResult = false;

      if (bSubscribe)
         bResult = super.Detach ();

      return bResult;
   }
}

MV.MVRP.Map.IO_RMROOT.FACTORY = class extends MV.MVIO.IO_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVRP.Map.IO_RMROOT (this.pReference, pClient);
   }
}

MV.MVRP.Map.IO_RMROOT.apAction =
{
   UPDATE :                      new MV.MVIO.SERVICE.CLIENT.ACTION
                                 (
                                    "RMRoot:update",
                                    {
                                       twRMRootIx : 0
                                    }
                                 ),

   NAME :                        new MV.MVIO.SERVICE.CLIENT.ACTION
                                 (
                                    "RMRoot:name",
                                    {
                                       twRMRootIx : 0,
                                       pName                   : MV.MVRP.Map.Class.RMROOT_NAME_IO.MAP
                                    }
                                 ),

   OWNER :                       new MV.MVIO.SERVICE.CLIENT.ACTION
                                 (
                                    "RMRoot:owner",
                                    {
                                       twRMRootIx         : 0,
                                       pOwner                  : MV.MVRP.Map.Class.RMCOMMON_OWNER_IO.MAP
                                    },
                                    function (pRequest_Out, pRequest_In)
                                    {
                                       pRequest_Out.twRMRootIx = pRequest_In.twRMRootIx;

                                       MV.MVRP.Map.Class.RMCOMMON_OWNER_IO.Convert (pRequest_Out, pRequest_In);
                                    }
                                 ),

   RMCOBJECT_OPEN :              new MV.MVIO.SERVICE.CLIENT.ACTION
                                 (
                                    "RMRoot:rmcobject_open",
                                    {
                                       twRMRootIx              : 0,
                                       pName                   : MV.MVRP.Map.Class.RMCOBJECT_NAME_IO.MAP,
                                       pType                   : MV.MVRP.Map.Class.RMCOMMON_TYPE_IO.MAP,
                                       pOwner                  : MV.MVRP.Map.Class.RMCOMMON_OWNER_IO.MAP,
                                       pResource               : MV.MVRP.Map.Class.RMCOMMON_RESOURCE_IO.MAP,
                                       pTransform              : MV.MVRP.Map.Class.RMCOMMON_TRANSFORM_IO.MAP,
                                       pOrbit_Spin             : MV.MVRP.Map.Class.RMCOMMON_ORBIT_SPIN_IO.MAP,
                                       pBound                  : MV.MVRP.Map.Class.RMCOMMON_BOUND_IO.MAP,
                                       pProperties             : MV.MVRP.Map.Class.RMCOBJECT_PROPERTIES_IO.MAP
                                    },
                                    function (pRequest_Out, pRequest_In)
                                    {
                                       pRequest_Out.twRMRootIx = pRequest_In.twRMRootIx;

                                       MV.MVRP.Map.Class.RMCOBJECT_NAME_IO.Convert       (pRequest_Out, pRequest_In);
                                       MV.MVRP.Map.Class.RMCOMMON_TYPE_IO.Convert          (pRequest_Out, pRequest_In);
                                       MV.MVRP.Map.Class.RMCOMMON_OWNER_IO.Convert       (pRequest_Out, pRequest_In);
                                       MV.MVRP.Map.Class.RMCOMMON_RESOURCE_IO.Convert    (pRequest_Out, pRequest_In);
                                       MV.MVRP.Map.Class.RMCOMMON_TRANSFORM_IO.Convert   (pRequest_Out, pRequest_In);
                                       MV.MVRP.Map.Class.RMCOMMON_ORBIT_SPIN_IO.Convert  (pRequest_Out, pRequest_In);
                                       MV.MVRP.Map.Class.RMCOMMON_BOUND_IO.Convert       (pRequest_Out, pRequest_In);
                                       MV.MVRP.Map.Class.RMCOBJECT_PROPERTIES_IO.Convert (pRequest_Out, pRequest_In);
                                    }
                                 ),

   RMCOBJECT_CLOSE :             new MV.MVIO.SERVICE.CLIENT.ACTION
                                 (
                                    "RMRoot:rmcobject_close",
                                    {
                                       twRMRootIx              : 0,
                                       twRMCObjectIx_Close     : 0,
                                       bDeleteAll              : 0
                                    }
                                 ),

   RMTOBJECT_OPEN :              new MV.MVIO.SERVICE.CLIENT.ACTION
                                 (
                                    "RMRoot:rmtobject_open",
                                    {
                                       twRMRootIx              : 0,
                                       pName                   : MV.MVRP.Map.Class.RMTOBJECT_NAME_IO.MAP,
                                       pType                   : MV.MVRP.Map.Class.RMCOMMON_TYPE_IO.MAP,
                                       pOwner                  : MV.MVRP.Map.Class.RMCOMMON_OWNER_IO.MAP,
                                       pResource               : MV.MVRP.Map.Class.RMCOMMON_RESOURCE_IO.MAP,
                                       pTransform              : MV.MVRP.Map.Class.RMCOMMON_TRANSFORM_IO.MAP,
                                       pBound                  : MV.MVRP.Map.Class.RMCOMMON_BOUND_IO.MAP,
                                       pProperties             : MV.MVRP.Map.Class.RMTOBJECT_PROPERTIES_IO.MAP,
                                       pCoord                  : MV.MVRP.Map.Class.DCOORD_IO.MAP
                                    },
                                    function (pRequest_Out, pRequest_In)
                                    {
                                       pRequest_Out.twRMRootIx = pRequest_In.twRMRootIx;

                                       MV.MVRP.Map.Class.RMTOBJECT_NAME_IO.Convert       (pRequest_Out, pRequest_In);
                                       MV.MVRP.Map.Class.RMCOMMON_TYPE_IO.Convert        (pRequest_Out, pRequest_In);
                                       MV.MVRP.Map.Class.RMCOMMON_OWNER_IO.Convert       (pRequest_Out, pRequest_In);
                                       MV.MVRP.Map.Class.RMCOMMON_RESOURCE_IO.Convert    (pRequest_Out, pRequest_In);
                                       MV.MVRP.Map.Class.RMCOMMON_TRANSFORM_IO.Convert   (pRequest_Out, pRequest_In);
                                       MV.MVRP.Map.Class.RMCOMMON_BOUND_IO.Convert       (pRequest_Out, pRequest_In);
                                       MV.MVRP.Map.Class.RMTOBJECT_PROPERTIES_IO.Convert (pRequest_Out, pRequest_In);
                                       MV.MVRP.Map.Class.DCOORD_IO.Convert               (pRequest_Out, pRequest_In);
                                    }
                                 ),

   RMTOBJECT_CLOSE :             new MV.MVIO.SERVICE.CLIENT.ACTION
                                 (
                                    "RMRoot:rmtobject_close",
                                    {
                                       twRMRootIx              : 0,
                                       twRMTObjectIx_Close     : 0,
                                       bDeleteAll              : 0
                                    }
                                 ),

   RMPOBJECT_OPEN :              new MV.MVIO.SERVICE.CLIENT.ACTION
                                 (
                                    "RMRoot:rmpobject_open",
                                    {
                                       twRMRootIx              : 0,
                                       pName                   : MV.MVRP.Map.Class.RMPOBJECT_NAME_IO.MAP,
                                       pType                   : MV.MVRP.Map.Class.RMCOMMON_TYPE_IO.MAP,
                                       pOwner                  : MV.MVRP.Map.Class.RMCOMMON_OWNER_IO.MAP,
                                       pResource               : MV.MVRP.Map.Class.RMCOMMON_RESOURCE_IO.MAP,
                                       pTransform              : MV.MVRP.Map.Class.RMCOMMON_TRANSFORM_IO.MAP,
                                       pBound                  : MV.MVRP.Map.Class.RMCOMMON_BOUND_IO.MAP
                                    },
                                    function (pRequest_Out, pRequest_In)
                                    {
                                       pRequest_Out.twRMRootIx = pRequest_In.twRMRootIx;

                                       MV.MVRP.Map.Class.RMPOBJECT_NAME_IO.Convert       (pRequest_Out, pRequest_In);
                                       MV.MVRP.Map.Class.RMCOMMON_TYPE_IO.Convert        (pRequest_Out, pRequest_In);
                                       MV.MVRP.Map.Class.RMCOMMON_OWNER_IO.Convert       (pRequest_Out, pRequest_In);
                                       MV.MVRP.Map.Class.RMCOMMON_RESOURCE_IO.Convert    (pRequest_Out, pRequest_In);
                                       MV.MVRP.Map.Class.RMCOMMON_TRANSFORM_IO.Convert   (pRequest_Out, pRequest_In);
                                       MV.MVRP.Map.Class.RMCOMMON_BOUND_IO.Convert       (pRequest_Out, pRequest_In);
                                    }
                                 ),

   RMPOBJECT_CLOSE :             new MV.MVIO.SERVICE.CLIENT.ACTION
                                 (
                                    "RMRoot:rmpobject_close",
                                    {
                                       twRMRootIx              : 0,
                                       twRMPObjectIx_Close     : 0,
                                       bDeleteAll              : 0
                                    }
                                 )
};

MV.MVRP.Map.IO_RMCOBJECT = class extends MV.MVRP.Map.IO_OBJECT
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVIO',
         'RMCObject',

         71,

         MV.MVRP.Map.IO_RMCOBJECT.apAction,

         true
      );
   }

   constructor (pReference, pClient)
   {
      super (pReference, pClient);
   }

   Map_Read (pModel)
   {
      this.pModel.pName                .Set (this.pData.pName.wsRMCObjectId);
      this.pModel.pType                .Set (this.pData.pType.bType, this.pData.pType.bSubtype, this.pData.pType.bFiction);
      this.pModel.pOwner               .Set (this.pData.pOwner.twRPersonaIx);
      this.pModel.pResource            .Set (this.pData.pResource.qwResource, this.pData.pResource.sName, this.pData.pResource.sReference);
      this.pModel.pTransform .vPosition.Set (this.pData.pTransform.Position[0], this.pData.pTransform.Position[1], this.pData.pTransform.Position[2]);
      this.pModel.pTransform .qRotation.Set (this.pData.pTransform.Rotation[0], this.pData.pTransform.Rotation[1], this.pData.pTransform.Rotation[2], this.pData.pTransform.Rotation[3]);
      this.pModel.pTransform .vScale   .Set (this.pData.pTransform.Scale   [0], this.pData.pTransform.Scale   [1], this.pData.pTransform.Scale   [2]);
      this.pModel.pOrbit_Spin          .Set (this.pData.pOrbit_Spin.tmPeriod, this.pData.pOrbit_Spin.tmStart, this.pData.pOrbit_Spin.dA, this.pData.pOrbit_Spin.dB);
      this.pModel.pBound               .Set (this.pData.pBound.Max[0], this.pData.pBound.Max[1], this.pData.pBound.Max[2]);
      this.pModel.pProperties          .Set (this.pData.pProperties.fMass, this.pData.pProperties.fGravity, this.pData.pProperties.fColor, this.pData.pProperties.fBrightness, this.pData.pProperties.fReflectivity);
      this.pModel.nChildren               =  this.pData.nChildren;
   }

   Attach (bSubscribe)
   {
      let bResult = true;

      if (bSubscribe)
      {
         bResult = super.Attach ();
      }
      else
      {
         let pIAction = this.Request ('UPDATE');
         let pRequest = pIAction.pRequest;

         pRequest.twRMCObjectIx = this.pModel.twRMCObjectIx;

         pIAction.Send (this, this.Response);
      }

      return bResult;
   }

   Attach ()
   {
      let pIAction = this.Request ('UPDATE');
      let pRequest = pIAction.pRequest;

      pRequest.twRMCObjectIx = this.pModel.twRMCObjectIx;

      pIAction.Send (this, this.Response);

      return true;
   }

   Detach ()
   {

   }
}

MV.MVRP.Map.IO_RMCOBJECT.FACTORY = class extends MV.MVIO.IO_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVRP.Map.IO_RMCOBJECT (this.pReference, pClient);
   }
}

MV.MVRP.Map.IO_RMCOBJECT.apAction =
{
   UPDATE :                      new MV.MVIO.SERVICE.CLIENT.ACTION
                                 (
                                    "RMCObject:update",
                                    {
                                       twRMCObjectIx : 0
                                    }
                                 ),

   SEARCH :                      new MV.MVIO.SERVICE.CLIENT.ACTION
                                 (
                                    "RMCObject:search",
                                    {
                                       twRMCObjectIx : 0,
                                       dX            : 0,
                                       dY            : 0,
                                       dZ            : 0,
                                       sText         : ''
                                    }
                                 ),

   INFO :                        new MV.MVIO.SERVICE.CLIENT.ACTION
                                 (
                                    "RMCObject:info",
                                    {
                                       twRMCObjectIx : 0,
                                       sType         : ''
                                    }
                                 ),

   BOUND:                        new MV.MVIO.SERVICE.CLIENT.ACTION
                                 (
                                    "RMCObject:bound",
                                    {
                                       twRMCObjectIx           : 0,
                                       pBound                  : MV.MVRP.Map.Class.RMCOMMON_BOUND_IO.MAP
                                    },
                                    function (pRequest_Out, pRequest_In)
                                    {
                                       pRequest_Out.twRMCObjectIx = pRequest_In.twRMCObjectIx;

                                       MV.MVRP.Map.Class.RMCOMMON_BOUND_IO.Convert (pRequest_Out, pRequest_In);
                                    }
                                 ),

   NAME :                        new MV.MVIO.SERVICE.CLIENT.ACTION
                                 (
                                    "RMCObject:name",
                                    {
                                       twRMCObjectIx           : 0,
                                       pName                   : MV.MVRP.Map.Class.RMCOBJECT_NAME_IO.MAP
                                    },
                                    function (pRequest_Out, pRequest_In)
                                    {
                                       pRequest_Out.twRMCObjectIx = pRequest_In.twRMCObjectIx;

                                       MV.MVRP.Map.Class.RMCOBJECT_NAME_IO.Convert (pRequest_Out, pRequest_In);
                                    }
                                 ),

   ORBIT_SPIN :                  new MV.MVIO.SERVICE.CLIENT.ACTION
                                 (
                                    "RMCObject:orbit_spin",
                                    {
                                       twRMCObjectIx           : 0,
                                       pOrbit_Spin             : MV.MVRP.Map.Class.RMCOMMON_ORBIT_SPIN_IO.MAP
                                    },
                                    function (pRequest_Out, pRequest_In)
                                    {
                                       pRequest_Out.twRMCObjectIx = pRequest_In.twRMCObjectIx;

                                       MV.MVRP.Map.Class.RMCOMMON_ORBIT_SPIN_IO.Convert (pRequest_Out, pRequest_In);
                                    }
                                 ),

   OWNER :                       new MV.MVIO.SERVICE.CLIENT.ACTION
                                 (
                                    "RMCObject:owner",
                                    {
                                       twRMCObjectIx           : 0,
                                       pOwner                  : MV.MVRP.Map.Class.RMCOMMON_OWNER_IO.MAP
                                    },
                                    function (pRequest_Out, pRequest_In)
                                    {
                                       pRequest_Out.twRMCObjectIx = pRequest_In.twRMCObjectIx;

                                       MV.MVRP.Map.Class.RMCOMMON_OWNER_IO.Convert (pRequest_Out, pRequest_In);
                                    }
                                 ),

   PROPERTIES :                  new MV.MVIO.SERVICE.CLIENT.ACTION
                                 (
                                    "RMCObject:properties",
                                    {
                                       twRMCObjectIx           : 0,
                                       pProperties             : MV.MVRP.Map.Class.RMCOBJECT_PROPERTIES_IO.MAP
                                    },
                                    function (pRequest_Out, pRequest_In)
                                    {
                                       pRequest_Out.twRMCObjectIx = pRequest_In.twRMCObjectIx;

                                       MV.MVRP.Map.Class.RMCOBJECT_PROPERTIES_IO.Convert (pRequest_Out, pRequest_In);
                                    }
                                 ),

   RESOURCE :                    new MV.MVIO.SERVICE.CLIENT.ACTION
                                 (
                                    "RMCObject:resource",
                                    {
                                       twRMCObjectIx           : 0,
                                       pResource               : MV.MVRP.Map.Class.RMCOMMON_RESOURCE_IO.MAP
                                    },
                                    function (pRequest_Out, pRequest_In)
                                    {
                                       pRequest_Out.twRMCObjectIx = pRequest_In.twRMCObjectIx;

                                       MV.MVRP.Map.Class.RMCOMMON_RESOURCE_IO.Convert (pRequest_Out, pRequest_In);
                                    }
                                 ),

   RMCOBJECT_OPEN :              new MV.MVIO.SERVICE.CLIENT.ACTION
                                 (
                                    "RMCObject:rmcobject_open",
                                    {
                                       twRMCObjectIx           : 0,
                                       pName                   : MV.MVRP.Map.Class.RMCOBJECT_NAME_IO.MAP,
                                       pType                   : MV.MVRP.Map.Class.RMCOMMON_TYPE_IO.MAP,
                                       pOwner                  : MV.MVRP.Map.Class.RMCOMMON_OWNER_IO.MAP,
                                       pResource               : MV.MVRP.Map.Class.RMCOMMON_RESOURCE_IO.MAP,
                                       pTransform              : MV.MVRP.Map.Class.RMCOMMON_TRANSFORM_IO.MAP,
                                       pOrbit_Spin             : MV.MVRP.Map.Class.RMCOMMON_ORBIT_SPIN_IO.MAP,
                                       pBound                  : MV.MVRP.Map.Class.RMCOMMON_BOUND_IO.MAP,
                                       pProperties             : MV.MVRP.Map.Class.RMCOBJECT_PROPERTIES_IO.MAP
                                    },
                                    function (pRequest_Out, pRequest_In)
                                    {
                                       pRequest_Out.twRMCObjectIx = pRequest_In.twRMCObjectIx;

                                       MV.MVRP.Map.Class.RMCOBJECT_NAME_IO.Convert       (pRequest_Out, pRequest_In);
                                       MV.MVRP.Map.Class.RMCOMMON_TYPE_IO.Convert        (pRequest_Out, pRequest_In);
                                       MV.MVRP.Map.Class.RMCOMMON_OWNER_IO.Convert       (pRequest_Out, pRequest_In);
                                       MV.MVRP.Map.Class.RMCOMMON_RESOURCE_IO.Convert    (pRequest_Out, pRequest_In);
                                       MV.MVRP.Map.Class.RMCOMMON_TRANSFORM_IO.Convert   (pRequest_Out, pRequest_In);
                                       MV.MVRP.Map.Class.RMCOMMON_ORBIT_SPIN_IO.Convert  (pRequest_Out, pRequest_In);
                                       MV.MVRP.Map.Class.RMCOMMON_BOUND_IO.Convert       (pRequest_Out, pRequest_In);
                                       MV.MVRP.Map.Class.RMCOBJECT_PROPERTIES_IO.Convert (pRequest_Out, pRequest_In);
                                    }
                                 ),

   RMCOBJECT_CLOSE :             new MV.MVIO.SERVICE.CLIENT.ACTION
                                 (
                                    "RMCObject:rmcobject_close",
                                    {
                                       twRMCObjectIx           : 0,
                                       twRMCObjectIx_Close     : 0,
                                       bDeleteAll              : 0
                                    }
                                 ),

   RMTOBJECT_OPEN :              new MV.MVIO.SERVICE.CLIENT.ACTION
                                 (
                                    "RMCObject:rmtobject_open",
                                    {
                                       twRMCObjectIx           : 0,
                                       pName                   : MV.MVRP.Map.Class.RMTOBJECT_NAME_IO.MAP,
                                       pType                   : MV.MVRP.Map.Class.RMCOMMON_TYPE_IO.MAP,
                                       pOwner                  : MV.MVRP.Map.Class.RMCOMMON_OWNER_IO.MAP,
                                       pResource               : MV.MVRP.Map.Class.RMCOMMON_RESOURCE_IO.MAP,
                                       pTransform              : MV.MVRP.Map.Class.RMCOMMON_TRANSFORM_IO.MAP,
                                       pBound                  : MV.MVRP.Map.Class.RMCOMMON_BOUND_IO.MAP,
                                       pProperties             : MV.MVRP.Map.Class.RMTOBJECT_PROPERTIES_IO.MAP,
                                       pCoord                  : MV.MVRP.Map.Class.DCOORD_IO.MAP
                                    },
                                    function (pRequest_Out, pRequest_In)
                                    {
                                       pRequest_Out.twRMCObjectIx = pRequest_In.twRMCObjectIx;

                                       MV.MVRP.Map.Class.RMTOBJECT_NAME_IO.Convert       (pRequest_Out, pRequest_In);
                                       MV.MVRP.Map.Class.RMCOMMON_TYPE_IO.Convert        (pRequest_Out, pRequest_In);
                                       MV.MVRP.Map.Class.RMCOMMON_OWNER_IO.Convert       (pRequest_Out, pRequest_In);
                                       MV.MVRP.Map.Class.RMCOMMON_RESOURCE_IO.Convert    (pRequest_Out, pRequest_In);
                                       MV.MVRP.Map.Class.RMCOMMON_TRANSFORM_IO.Convert   (pRequest_Out, pRequest_In);
                                       MV.MVRP.Map.Class.RMCOMMON_BOUND_IO.Convert       (pRequest_Out, pRequest_In);
                                       MV.MVRP.Map.Class.RMTOBJECT_PROPERTIES_IO.Convert (pRequest_Out, pRequest_In);
                                       MV.MVRP.Map.Class.DCOORD_IO.Convert               (pRequest_Out, pRequest_In);
                                    }
                                 ),

   RMTOBJECT_CLOSE :             new MV.MVIO.SERVICE.CLIENT.ACTION
                                 (
                                    "RMCObject:rmtobject_close",
                                    {
                                       twRMCObjectIx           : 0,
                                       twRMTObjectIx_Close     : 0,
                                       bDeleteAll              : 0
                                    }
                                 ),

   TRANSFORM :                   new MV.MVIO.SERVICE.CLIENT.ACTION
                                 (
                                    "RMCObject:transform",
                                    {
                                       twRMCObjectIx           : 0,
                                       pTransform              : MV.MVRP.Map.Class.RMCOMMON_TRANSFORM_IO.MAP,
                                       pCoord                  : MV.MVRP.Map.Class.DCOORD_IO.MAP
                                    },
                                    function (pRequest_Out, pRequest_In)
                                    {
                                       pRequest_Out.twRMCObjectIx = pRequest_In.twRMCObjectIx;

                                       MV.MVRP.Map.Class.RMCOMMON_TRANSFORM_IO.Convert   (pRequest_Out, pRequest_In);
                                       MV.MVRP.Map.Class.DCOORD_IO.Convert               (pRequest_Out, pRequest_In);
                                    }
                                 ),

   TYPE :                        new MV.MVIO.SERVICE.CLIENT.ACTION
                                 (
                                    "RMCObject:",
                                    {
                                       twRMCObjectIx           : 0,
                                       pType                   : MV.MVRP.Map.Class.RMCOMMON_TYPE_IO.MAP
                                    },
                                    function (pRequest_Out, pRequest_In)
                                    {
                                       pRequest_Out.twRMCObjectIx = pRequest_In.twRMCObjectIx;

                                       MV.MVRP.Map.Class.RMCOMMON_TYPE_IO.Convert        (pRequest_Out, pRequest_In);
                                    }
                                 ),

};

MV.MVRP.Map.IO_RMTOBJECT = class extends MV.MVRP.Map.IO_OBJECT
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVIO',
         'RMTObject',

         72,

         MV.MVRP.Map.IO_RMTOBJECT.apAction,

         true
      );
   }

   Map_Read (pModel)
   {
      this.pModel.pName                .Set (this.pData.pName.wsRMTObjectId);
      this.pModel.pType                .Set (this.pData.pType.bType, this.pData.pType.bSubtype, this.pData.pType.bFiction);
      this.pModel.pOwner               .Set (this.pData.pOwner.twRPersonaIx);
      this.pModel.pResource            .Set (this.pData.pResource.qwResource, this.pData.pResource.sName, this.pData.pResource.sReference);
      this.pModel.pTransform .vPosition.Set (this.pData.pTransform.Position[0], this.pData.pTransform.Position[1], this.pData.pTransform.Position[2]);
      this.pModel.pTransform .qRotation.Set (this.pData.pTransform.Rotation[0], this.pData.pTransform.Rotation[1], this.pData.pTransform.Rotation[2], this.pData.pTransform.Rotation[3]);
      this.pModel.pTransform .vScale   .Set (this.pData.pTransform.Scale   [0], this.pData.pTransform.Scale   [1], this.pData.pTransform.Scale   [2]);
      this.pModel.pBound               .Set (this.pData.pBound.Max[0], this.pData.pBound.Max[1], this.pData.pBound.Max[2]);
      this.pModel.pProperties          .Set (this.pData.pProperties.bLockToGround, this.pData.pProperties.bYouth, this.pData.pProperties.bAdult, this.pData.pProperties.bAvatar);
      this.pModel.nChildren               =  this.pData.nChildren;
   }

   Attach (bSubscribe)
   {
      let bResult = true;

      if (bSubscribe)
      {
         bResult = super.Attach ();
      }
      else
      {
         let pIAction = this.Request ('UPDATE');
         let pRequest = pIAction.pRequest;

         pRequest.twRMTObjectIx = this.pModel.twRMTObjectIx;

         pIAction.Send (this, this.Response);
      }

      return bResult;
   }

   Detach ()
   {

   }
}

MV.MVRP.Map.IO_RMTOBJECT.FACTORY = class extends MV.MVIO.IO_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVRP.Map.IO_RMTOBJECT (this.pReference, pClient);
   }
}

MV.MVRP.Map.IO_RMTOBJECT.apAction =
{
   UPDATE :                      new MV.MVIO.SERVICE.CLIENT.ACTION
                                 (
                                    "RMTObject:update",
                                    {
                                       twRMTObjectIx : 0
                                    }
                                 ),

   SEARCH :                      new MV.MVIO.SERVICE.CLIENT.ACTION
                                 (
                                    "RMTObject:search",
                                    {
                                       twRMTObjectIx : 0,
                                       dX            : 0,
                                       dY            : 0,
                                       dZ            : 0,
                                       sText         : ''
                                    }
                                 ),

   INFO :                        new MV.MVIO.SERVICE.CLIENT.ACTION
                                 (
                                    "RMTObject:info",
                                    {
                                       twRMTObjectIx : 0,
                                       sType         : ''
                                    }
                                 ),

   NAME :                        new MV.MVIO.SERVICE.CLIENT.ACTION
                                 (
                                    "RMTObject:name",
                                    {
                                       twRMTObjectIx           : 0,
                                       pName                   : MV.MVRP.Map.Class.RMTOBJECT_NAME_IO.MAP
                                    },
                                    function (pRequest_Out, pRequest_In)
                                    {
                                       pRequest_Out.twRMTObjectIx = pRequest_In.twRMTObjectIx;

                                       MV.MVRP.Map.Class.RMTOBJECT_NAME_IO.Convert (pRequest_Out, pRequest_In);
                                    }
                                 ),

   TYPE :                        new MV.MVIO.SERVICE.CLIENT.ACTION
                                 (
                                    "RMTObject:type",
                                    {
                                       twRMTObjectIx           : 0,
                                       pType                   : MV.MVRP.Map.Class.RMCOMMON_TYPE_IO.MAP
                                    },
                                    function (pRequest_Out, pRequest_In)
                                    {
                                       pRequest_Out.twRMTObjectIx = pRequest_In.twRMTObjectIx;

                                       MV.MVRP.Map.Class.RMCOMMON_TYPE_IO.Convert          (pRequest_Out, pRequest_In);
                                    }
                                 ),

   OWNER :                       new MV.MVIO.SERVICE.CLIENT.ACTION
                                 (
                                    "RMTObject:owner",
                                    {
                                       twRMTObjectIx           : 0,
                                       pOwner                  : MV.MVRP.Map.Class.RMCOMMON_OWNER_IO.MAP
                                    },
                                    function (pRequest_Out, pRequest_In)
                                    {
                                       pRequest_Out.twRMTObjectIx = pRequest_In.twRMTObjectIx;

                                       MV.MVRP.Map.Class.RMCOMMON_OWNER_IO.Convert (pRequest_Out, pRequest_In);
                                    }
                                 ),

   RESOURCE :                    new MV.MVIO.SERVICE.CLIENT.ACTION
                                 (
                                    "RMTObject:resource",
                                    {
                                       twRMTObjectIx           : 0,
                                       pResource               : MV.MVRP.Map.Class.RMCOMMON_RESOURCE_IO.MAP
                                    },
                                    function (pRequest_Out, pRequest_In)
                                    {
                                       pRequest_Out.twRMTObjectIx = pRequest_In.twRMTObjectIx;

                                       MV.MVRP.Map.Class.RMCOMMON_RESOURCE_IO.Convert (pRequest_Out, pRequest_In);
                                    }
                                 ),

   TRANSFORM :                   new MV.MVIO.SERVICE.CLIENT.ACTION
                                 (
                                    "RMTObject:transform",
                                    {
                                       twRMTObjectIx           : 0,
                                       pTransform              : MV.MVRP.Map.Class.RMCOMMON_TRANSFORM_IO.MAP,
                                       pCoord                  : MV.MVRP.Map.Class.DCOORD_IO.MAP
                                    },
                                    function (pRequest_Out, pRequest_In)
                                    {
                                       pRequest_Out.twRMTObjectIx = pRequest_In.twRMTObjectIx;

                                       MV.MVRP.Map.Class.RMCOMMON_TRANSFORM_IO.Convert    (pRequest_Out, pRequest_In);
                                       MV.MVRP.Map.Class.DCOORD_IO.Convert                (pRequest_Out, pRequest_In);
                                    }
                                 ),

   BOUND :                       new MV.MVIO.SERVICE.CLIENT.ACTION
                                 (
                                    "RMTObject:bound",
                                    {
                                       twRMTObjectIx           : 0,
                                       pBound                  : MV.MVRP.Map.Class.RMCOMMON_BOUND_IO.MAP
                                    },
                                    function (pRequest_Out, pRequest_In)
                                    {
                                       pRequest_Out.twRMTObjectIx = pRequest_In.twRMTObjectIx;

                                       MV.MVRP.Map.Class.RMCOMMON_BOUND_IO.Convert (pRequest_Out, pRequest_In);
                                    }
                                 ),

   PROPERTIES :                  new MV.MVIO.SERVICE.CLIENT.ACTION
                                 (
                                    "RMTObject:properties",
                                    {
                                       twRMTObjectIx           : 0,
                                       pProperties             : MV.MVRP.Map.Class.RMTOBJECT_PROPERTIES_IO.MAP
                                    },
                                    function (pRequest_Out, pRequest_In)
                                    {
                                       pRequest_Out.twRMTObjectIx = pRequest_In.twRMTObjectIx;

                                       MV.MVRP.Map.Class.RMTOBJECT_PROPERTIES_IO.Convert (pRequest_Out, pRequest_In);
                                    }
                                 ),

   RMTOBJECT_OPEN :              new MV.MVIO.SERVICE.CLIENT.ACTION
                                 (
                                    "RMTObject:rmtobject_open",
                                    {
                                       twRMTObjectIx           : 0,
                                       pName                   : MV.MVRP.Map.Class.RMTOBJECT_NAME_IO.MAP,
                                       pType                   : MV.MVRP.Map.Class.RMCOMMON_TYPE_IO.MAP,
                                       pOwner                  : MV.MVRP.Map.Class.RMCOMMON_OWNER_IO.MAP,
                                       pResource               : MV.MVRP.Map.Class.RMCOMMON_RESOURCE_IO.MAP,
                                       pTransform              : MV.MVRP.Map.Class.RMCOMMON_TRANSFORM_IO.MAP,
                                       pBound                  : MV.MVRP.Map.Class.RMCOMMON_BOUND_IO.MAP,
                                       pProperties             : MV.MVRP.Map.Class.RMTOBJECT_PROPERTIES_IO.MAP,
                                       pCoord                  : MV.MVRP.Map.Class.DCOORD_IO.MAP
                                    },
                                    function (pRequest_Out, pRequest_In)
                                    {
                                       pRequest_Out.twRMTObjectIx = pRequest_In.twRMTObjectIx;

                                       MV.MVRP.Map.Class.RMTOBJECT_NAME_IO.Convert       (pRequest_Out, pRequest_In);
                                       MV.MVRP.Map.Class.RMCOMMON_TYPE_IO.Convert        (pRequest_Out, pRequest_In);
                                       MV.MVRP.Map.Class.RMCOMMON_OWNER_IO.Convert       (pRequest_Out, pRequest_In);
                                       MV.MVRP.Map.Class.RMCOMMON_RESOURCE_IO.Convert    (pRequest_Out, pRequest_In);
                                       MV.MVRP.Map.Class.RMCOMMON_TRANSFORM_IO.Convert   (pRequest_Out, pRequest_In);
                                       MV.MVRP.Map.Class.RMCOMMON_BOUND_IO.Convert       (pRequest_Out, pRequest_In);
                                       MV.MVRP.Map.Class.RMTOBJECT_PROPERTIES_IO.Convert (pRequest_Out, pRequest_In);
                                       MV.MVRP.Map.Class.DCOORD_IO.Convert               (pRequest_Out, pRequest_In);
                                    }
                                 ),

   RMTOBJECT_CLOSE :             new MV.MVIO.SERVICE.CLIENT.ACTION
                                 (
                                    "RMTObject:rmtobject_close",
                                    {
                                       twRMTObjectIx           : 0,
                                       twRMTObjectIx_Close     : 0,
                                       bDeleteAll              : 0
                                    }
                                 ),

   RMPOBJECT_OPEN :              new MV.MVIO.SERVICE.CLIENT.ACTION
                                 (
                                    "RMTObject:rmpobject_open",
                                    {
                                       twRMTObjectIx           : 0,
                                       pName                   : MV.MVRP.Map.Class.RMPOBJECT_NAME_IO.MAP,
                                       pType                   : MV.MVRP.Map.Class.RMCOMMON_TYPE_IO.MAP,
                                       pOwner                  : MV.MVRP.Map.Class.RMCOMMON_OWNER_IO.MAP,
                                       pResource               : MV.MVRP.Map.Class.RMCOMMON_RESOURCE_IO.MAP,
                                       pTransform              : MV.MVRP.Map.Class.RMCOMMON_TRANSFORM_IO.MAP,
                                       pBound                  : MV.MVRP.Map.Class.RMCOMMON_BOUND_IO.MAP
                                    },
                                    function (pRequest_Out, pRequest_In)
                                    {
                                       pRequest_Out.twRMTObjectIx = pRequest_In.twRMTObjectIx;

                                       MV.MVRP.Map.Class.RMPOBJECT_NAME_IO.Convert       (pRequest_Out, pRequest_In);
                                       MV.MVRP.Map.Class.RMCOMMON_TYPE_IO.Convert        (pRequest_Out, pRequest_In);
                                       MV.MVRP.Map.Class.RMCOMMON_OWNER_IO.Convert       (pRequest_Out, pRequest_In);
                                       MV.MVRP.Map.Class.RMCOMMON_RESOURCE_IO.Convert    (pRequest_Out, pRequest_In);
                                       MV.MVRP.Map.Class.RMCOMMON_TRANSFORM_IO.Convert   (pRequest_Out, pRequest_In);
                                       MV.MVRP.Map.Class.RMCOMMON_BOUND_IO.Convert       (pRequest_Out, pRequest_In);
                                    }
                                 ),

   RMPOBJECT_CLOSE :             new MV.MVIO.SERVICE.CLIENT.ACTION
                                 (
                                    "RMTObject:rmpobject_close",
                                    {
                                       twRMTObjectIx           : 0,
                                       twRMPObjectIx_Close     : 0,
                                       bDeleteAll              : 0
                                    }
                                 ),
};

MV.MVRP.Map.IO_RMPOBJECT = class extends MV.MVRP.Map.IO_OBJECT
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVIO',
         'RMPObject',

         73,

         MV.MVRP.Map.IO_RMPOBJECT.apAction,

         true
      );
   }

   constructor (pReference, pClient)
   {
      super (pReference, pClient);
   }

   Map_Read (pModel)
   {
      this.pModel.pName                .Set (this.pData.pName.wsRMPObjectId);
      this.pModel.pType                .Set (this.pData.pType.bType, this.pData.pType.bSubtype, this.pData.pType.bFiction, this.pData.pType.bMovable);
      this.pModel.pOwner               .Set (this.pData.pOwner.twRPersonaIx);
      this.pModel.pResource            .Set (this.pData.pResource.qwResource, this.pData.pResource.sName, this.pData.pResource.sReference);
      this.pModel.pTransform .vPosition.Set (this.pData.pTransform.Position[0], this.pData.pTransform.Position[1], this.pData.pTransform.Position[2]);
      this.pModel.pTransform .qRotation.Set (this.pData.pTransform.Rotation[0], this.pData.pTransform.Rotation[1], this.pData.pTransform.Rotation[2], this.pData.pTransform.Rotation[3]);
      this.pModel.pTransform .vScale   .Set (this.pData.pTransform.Scale   [0], this.pData.pTransform.Scale   [1], this.pData.pTransform.Scale   [2]);
      this.pModel.pBound               .Set (this.pData.pBound.Max[0], this.pData.pBound.Max[1], this.pData.pBound.Max[2]);
      this.pModel.nChildren               =  this.pData.nChildren;
   }

   Attach (bSubscribe)
   {
      let bResult = true;

      if (bSubscribe)
      {
         bResult = super.Attach ();
      }
      else
      {
         let pIAction = this.Request ('UPDATE');
         let pRequest = pIAction.pRequest;

         pRequest.twRMPObjectIx = this.pModel.twRMPObjectIx;

         pIAction.Send (this, this.Response);
      }

      return bResult;
   }

   Detach ()
   {

   }
}

MV.MVRP.Map.IO_RMPOBJECT.FACTORY = class extends MV.MVIO.IO_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVRP.Map.IO_RMPOBJECT (this.pReference, pClient);
   }
}

MV.MVRP.Map.IO_RMPOBJECT.apAction =
{
   UPDATE :                      new MV.MVIO.SERVICE.CLIENT.ACTION
                                 (
                                    "RMPObject:update",
                                    {
                                       twRMPObjectIx : 0
                                    }
                                 ),

   INFO :                        new MV.MVIO.SERVICE.CLIENT.ACTION
                                 (
                                    "RMPObject:info",
                                    {
                                       twRMPObjectIx : 0,
                                       sType         : ''
                                    }
                                 ),

   NAME :                        new MV.MVIO.SERVICE.CLIENT.ACTION
                                 (
                                    "RMPObject:name",
                                    {
                                       twRMPObjectIx           : 0,
                                       pName                   : MV.MVRP.Map.Class.RMPOBJECT_NAME_IO.MAP
                                    },
                                    function (pRequest_Out, pRequest_In)
                                    {
                                       pRequest_Out.twRMPObjectIx = pRequest_In.twRMPObjectIx;

                                       MV.MVRP.Map.Class.RMPOBJECT_NAME_IO.Convert (pRequest_Out, pRequest_In);
                                    }
                                 ),

   TYPE :                        new MV.MVIO.SERVICE.CLIENT.ACTION
                                 (
                                    "RMPObject:type",
                                    {
                                       twRMPObjectIx           : 0,
                                       pType                   : MV.MVRP.Map.Class.RMCOMMON_TYPE_IO.MAP
                                    },
                                    function (pRequest_Out, pRequest_In)
                                    {
                                       pRequest_Out.twRMPObjectIx = pRequest_In.twRMPObjectIx;

                                       MV.MVRP.Map.Class.RMCOMMON_TYPE_IO.Convert        (pRequest_Out, pRequest_In);
                                    }
                                 ),

   OWNER :                       new MV.MVIO.SERVICE.CLIENT.ACTION
                                 (
                                    "RMPObject:owner",
                                    {
                                       twRMPObjectIx           : 0,
                                       pOwner                  : MV.MVRP.Map.Class.RMCOMMON_OWNER_IO.MAP
                                    },
                                    function (pRequest_Out, pRequest_In)
                                    {
                                       pRequest_Out.twRMPObjectIx = pRequest_In.twRMPObjectIx;

                                       MV.MVRP.Map.Class.RMCOMMON_OWNER_IO.Convert (pRequest_Out, pRequest_In);
                                    }
                                 ),

   RESOURCE :                    new MV.MVIO.SERVICE.CLIENT.ACTION
                                 (
                                    "RMPObject:resource",
                                    {
                                       twRMPObjectIx           : 0,
                                       pResource               : MV.MVRP.Map.Class.RMCOMMON_RESOURCE_IO.MAP
                                    },
                                    function (pRequest_Out, pRequest_In)
                                    {
                                       pRequest_Out.twRMPObjectIx = pRequest_In.twRMPObjectIx;

                                       MV.MVRP.Map.Class.RMCOMMON_RESOURCE_IO.Convert (pRequest_Out, pRequest_In);
                                    }
                                 ),

   TRANSFORM :                   new MV.MVIO.SERVICE.CLIENT.ACTION
                                 (
                                    "RMPObject:transform",
                                    {
                                       twRMPObjectIx           : 0,
                                       pTransform              : MV.MVRP.Map.Class.RMCOMMON_TRANSFORM_IO.MAP
                                    },
                                    function (pRequest_Out, pRequest_In)
                                    {
                                       pRequest_Out.twRMPObjectIx = pRequest_In.twRMPObjectIx;

                                       MV.MVRP.Map.Class.RMCOMMON_TRANSFORM_IO.Convert   (pRequest_Out, pRequest_In);
                                    }
                                 ),

   BOUND :                       new MV.MVIO.SERVICE.CLIENT.ACTION
                                 (
                                    "RMPObject:bound",
                                    {
                                       twRMPObjectIx           : 0,
                                       pBound                  : MV.MVRP.Map.Class.RMCOMMON_BOUND_IO.MAP
                                    },
                                    function (pRequest_Out, pRequest_In)
                                    {
                                       pRequest_Out.twRMPObjectIx = pRequest_In.twRMPObjectIx;

                                       MV.MVRP.Map.Class.RMCOMMON_BOUND_IO.Convert (pRequest_Out, pRequest_In);
                                    }
                                 ),

   RMPOBJECT_OPEN :              new MV.MVIO.SERVICE.CLIENT.ACTION
                                 (
                                    "RMPObject:rmpobject_open",
                                    {
                                       twRMPObjectIx           : 0,
                                       pName                   : MV.MVRP.Map.Class.RMPOBJECT_NAME_IO.MAP,
                                       pType                   : MV.MVRP.Map.Class.RMCOMMON_TYPE_IO.MAP,
                                       pOwner                  : MV.MVRP.Map.Class.RMCOMMON_OWNER_IO.MAP,
                                       pResource               : MV.MVRP.Map.Class.RMCOMMON_RESOURCE_IO.MAP,
                                       pTransform              : MV.MVRP.Map.Class.RMCOMMON_TRANSFORM_IO.MAP,
                                       pBound                  : MV.MVRP.Map.Class.RMCOMMON_BOUND_IO.MAP
                                    },
                                    function (pRequest_Out, pRequest_In)
                                    {
                                       pRequest_Out.twRMPObjectIx = pRequest_In.twRMPObjectIx;

                                       MV.MVRP.Map.Class.RMPOBJECT_NAME_IO.Convert       (pRequest_Out, pRequest_In);
                                       MV.MVRP.Map.Class.RMCOMMON_TYPE_IO.Convert        (pRequest_Out, pRequest_In);
                                       MV.MVRP.Map.Class.RMCOMMON_OWNER_IO.Convert       (pRequest_Out, pRequest_In);
                                       MV.MVRP.Map.Class.RMCOMMON_RESOURCE_IO.Convert    (pRequest_Out, pRequest_In);
                                       MV.MVRP.Map.Class.RMCOMMON_TRANSFORM_IO.Convert   (pRequest_Out, pRequest_In);
                                       MV.MVRP.Map.Class.RMCOMMON_BOUND_IO.Convert       (pRequest_Out, pRequest_In);
                                    }
                                 ),

   RMPOBJECT_CLOSE :             new MV.MVIO.SERVICE.CLIENT.ACTION
                                 (
                                    "RMPObject:rmpobject_close",
                                    {
                                       twRMPObjectIx           : 0,
                                       twRMPObjectIx_Close     : 0,
                                       bDeleteAll              : 0
                                    }
                                 ),

   PARENT :                      new MV.MVIO.SERVICE.CLIENT.ACTION
                                 (
                                    "RMPObject:parent",
                                    {
                                       twRMPObjectIx           : 0,
                                       wClass                  : 0,
                                       twObjectIx              : 0
                                    }
                                 )
};

MV.MVRP.Map.RMROOT = class extends MV.MVMF.MODEL_OBJECT
{
   static factory ()
   {
      return new this.FACTORY ('RMRoot');
   }

   constructor (pReference, pSource)
   {
      super (pReference, pSource);

      this.twRMRootIx = pReference.twObjectIx;

      this.pName  = new MV.MVRP.Map.Class.RMROOT_NAME    ();
      this.pOwner = new MV.MVRP.Map.Class.RMCOMMON_OWNER ();
   }

   destructor ()
   {
      this.pName  = this.pName .destructor ();
      this.pOwner = this.pOwner.destructor ();

      return super.destructor ();
   }

   Request (sAction)
   {
      let pIAction = super.Request (sAction);
      if (pIAction)
      {
         let pRequest = pIAction.pRequest;

         if ('twRMRootIx' in pRequest)
            pRequest.twRMRootIx = this.twRMRootIx;
      }

      return pIAction;
   }
}

MV.MVRP.Map.RMROOT.FACTORY = class extends MV.MVMF.MODEL_OBJECT.FACTORY
{

   Reference (asArgs)
   {
      let twRMRootIx = Number (asArgs[0]);

      return new MV.MVRP.Map.RMROOT.IREFERENCE (this.sID, twRMRootIx);
   }
}

MV.MVRP.Map.RMROOT.IREFERENCE = class extends MV.MVMF.MODEL_OBJECT.IREFERENCE
{

   Create (pSource)
   {
      return new MV.MVRP.Map.RMROOT (this, pSource);
   }
}

MV.MVRP.Map.RMCOBJECT = class extends MV.MVMF.MODEL_OBJECT
{
   static factory ()
   {
      return new this.FACTORY ('RMCObject');
   }

   static eTYPE =
   {
      NULL          :  0,
      UNIVERSE      :  1,
      SUPERCLUSTER  :  2,
      GALAXYCLUSTER :  3,
      GALAXY        :  4,
      BLACKHOLE     :  5,
      NEBULA        :  6,
      STARCLUSTER   :  7,
      CONSTELLATION :  8,
      STARSYSTEM    :  9,
      STAR          : 10,
      PLANETSYSTEM  : 11,
      PLANET        : 12,
      MOON          : 13,
      DEBRIS        : 14,
      SATELLITE     : 15,
      TRANSPORT     : 16,
      SURFACE       : 17,
   };

   eTYPE       = MV.MVRP.Map.RMCOBJECT.eTYPE;

   constructor (pReference, pSource)
   {
      super (pReference, pSource);

      this.twRMCObjectIx = pReference.twObjectIx;

      this.pName       = new MV.MVRP.Map.Class.RMCOBJECT_NAME       ();
      this.pType       = new MV.MVRP.Map.Class.RMCOMMON_TYPE        ();
      this.pOwner      = new MV.MVRP.Map.Class.RMCOMMON_OWNER       ();
      this.pResource   = new MV.MVRP.Map.Class.RMCOMMON_RESOURCE    ();
      this.pTransform  = new MV.MVRP.Map.Class.RMCOMMON_TRANSFORM   ();
      this.pOrbit_Spin = new MV.MVRP.Map.Class.RMCOMMON_ORBIT_SPIN  ();
      this.pBound      = new MV.MVRP.Map.Class.RMCOMMON_BOUND       ();
      this.pProperties = new MV.MVRP.Map.Class.RMCOBJECT_PROPERTIES ();
   }

   destructor ()
   {
      this.pName       = this.pName       .destructor ();
      this.pType       = this.pType       .destructor ();
      this.pOwner      = this.pOwner      .destructor ();
      this.pResource   = this.pResource   .destructor ();
      this.pTransform  = this.pTransform  .destructor ();
      this.pOrbit_Spin = this.pOrbit_Spin .destructor ();
      this.pBound      = this.pBound      .destructor ();
      this.pProperties = this.pProperties .destructor ();

      return super.destructor ();
   }

   Request (sAction)
   {
      let pIAction = super.Request (sAction);
      if (pIAction)
      {
         let pRequest = pIAction.pRequest;

         if ('twRMCObjectIx' in pRequest)
            pRequest.twRMCObjectIx = this.twRMCObjectIx;
      }

      return pIAction;
   }

   Search (vPosition)
   {
      return new MV.MVRP.Map.RMCOBJECT.SEARCH (this, vPosition);
   }
}

MV.MVRP.Map.RMCOBJECT.FACTORY = class extends MV.MVMF.MODEL_OBJECT.FACTORY
{

   Reference (asArgs)
   {
      let twRMCObjectIx = Number (asArgs[0]);

      return new MV.MVRP.Map.RMCOBJECT.IREFERENCE (this.sID, twRMCObjectIx);
   }
}

MV.MVRP.Map.RMCOBJECT.IREFERENCE = class extends MV.MVMF.MODEL_OBJECT.IREFERENCE
{

   Create (pSource)
   {
      return new MV.MVRP.Map.RMCOBJECT (this, pSource);
   }
}

MV.MVRP.Map.RMCOBJECT.SEARCH = class extends MV.MVMF.NOTIFICATION
{
   constructor (pModel, vPosition)
   {
      super ();

      this.pModel    = pModel;
      this.vPosition = new MV.MVRP.Map.Class.VECTOR3 (0, 0, 0);
      this.sText     = '';

      this.tInput    = null;
      this.pIAction  = null;

      if (vPosition)
         this.vPosition.Set (vPosition.dX, vPosition.dY, vPosition.dZ);
   }

   destructor ()
   {
      this.Cancel ();

      return super.destructor ();
   }

   Cancel ()
   {
      if (this.tInput != null)
      {
         clearTimeout (this.tInput);

         this.tInput = null;
      }
      if (this.pIAction != null)
      {
         this.pIAction.Abort ();

         this.pIAction = null;
      }
   }

   Input (sText)
   {
      let onResponse = function (pIAction)
      {
         let pData = pIAction.pResponse;

         if (pData.nResult == 0)
         {
            this.Emit ('onResult', pData);
         }
      }

      let onTimeout = function ()
      {
         let pIAction = this.pModel.Request ('SEARCH');

         if (pIAction != null)
         {
            let pRequest = pIAction.pRequest;

            pRequest.twRMCObjectIx = this.pModel.twRMCObjectIx;
            pRequest.dX            = this.vPosition.dX;
            pRequest.dY            = this.vPosition.dY;
            pRequest.dZ            = this.vPosition.dZ;
            pRequest.sText         = this.sText;

            pIAction.Send (this, onResponse);
         }
      }

      var n;

      if ((n = sText.indexOf (',')) >= 0)
         sText = sText.slice (0, n);
      sText = sText.toLowerCase ();

      if (this.sText != sText)
      {
         this.Cancel ();

         this.sText = sText;

         this.tInput = setTimeout (onTimeout.bind (this), 250);
      }
   }
}

MV.MVRP.Map.RMTOBJECT = class extends MV.MVMF.MODEL_OBJECT
{
   static factory ()
   {
      return new this.FACTORY ('RMTObject');
   }

   static eTYPE =
   {
      NULL      :  0,
      ROOT      :  1,
      WATER     :  2,
      LAND      :  3,
      COUNTRY   :  4,
      TERRITORY :  5,
      STATE     :  6,
      COUNTY    :  7,
      CITY      :  8,
      COMMUNITY :  9,
      SECTOR    : 10,
      PARCEL    : 11,
   };

   eTYPE       = MV.MVRP.Map.RMTOBJECT.eTYPE;

   constructor (pReference, pSource)
   {
      super (pReference, pSource);

      this.twRMTObjectIx = pReference.twObjectIx;

      this.pName       = new MV.MVRP.Map.Class.RMTOBJECT_NAME       ();
      this.pType       = new MV.MVRP.Map.Class.RMCOMMON_TYPE        ();
      this.pOwner      = new MV.MVRP.Map.Class.RMCOMMON_OWNER       ();
      this.pResource   = new MV.MVRP.Map.Class.RMCOMMON_RESOURCE    ();
      this.pTransform  = new MV.MVRP.Map.Class.RMCOMMON_TRANSFORM   ();
      this.pBound      = new MV.MVRP.Map.Class.RMCOMMON_BOUND       ();
      this.pProperties = new MV.MVRP.Map.Class.RMTOBJECT_PROPERTIES ();
   }

   destructor ()
   {
      this.pName       = this.pName      .destructor ();
      this.pType       = this.pType      .destructor ();
      this.pOwner      = this.pOwner     .destructor ();
      this.pResource   = this.pResource  .destructor ();
      this.pTransform  = this.pTransform .destructor ();
      this.pBound      = this.pBound     .destructor ();
      this.pProperties = this.pProperties.destructor ();

      return super.destructor ();
   }

   Request (sAction)
   {
      let pIAction = super.Request (sAction);
      if (pIAction)
      {
         let pRequest = pIAction.pRequest;

         if ('twRMTObjectIx' in pRequest)
            pRequest.twRMTObjectIx = this.twRMTObjectIx;
      }

      return pIAction;
   }

   Search (vPosition)
   {
      return new MV.MVRP.Map.RMTOBJECT.SEARCH (this, vPosition);
   }
}

MV.MVRP.Map.RMTOBJECT.FACTORY = class extends MV.MVMF.MODEL_OBJECT.FACTORY
{

   Reference (asArgs)
   {
      let twRMTObjectIx = Number (asArgs[0]);

      return new MV.MVRP.Map.RMTOBJECT.IREFERENCE (this.sID, twRMTObjectIx);
   }
}

MV.MVRP.Map.RMTOBJECT.IREFERENCE = class extends MV.MVMF.MODEL_OBJECT.IREFERENCE
{

   Create (pSource)
   {
      return new MV.MVRP.Map.RMTOBJECT (this, pSource);
   }
}

MV.MVRP.Map.RMTOBJECT.SEARCH = class extends MV.MVMF.NOTIFICATION
{
   constructor (pModel, vPosition)
   {
      super ();

      this.pModel    = pModel;
      this.vPosition = new MV.MVRP.Map.Class.VECTOR3 (0, 0, 0);
      this.sText     = '';

      this.tInput    = null;
      this.pIAction  = null;

      if (vPosition)
         this.vPosition.Set (vPosition.dX, vPosition.dY, vPosition.dZ);
   }

   destructor ()
   {
      this.Cancel ();

      return super.destructor ();
   }

   Cancel ()
   {
      if (this.tInput != null)
      {
         clearTimeout (this.tInput);

         this.tInput = null;
      }
      if (this.pIAction != null)
      {
         this.pIAction.Abort ();

         this.pIAction = null;
      }
   }

   Input (sText)
   {
      let onResponse = function (pIAction)
      {
         let pData = pIAction.pResponse;

         if (pData.nResult == 0)
         {
            this.Emit ('onResult', pData);
         }
      }

      let onTimeout = function ()
      {
         let pIAction = this.pModel.Request ('SEARCH');

         if (pIAction != null)
         {
            let pRequest = pIAction.pRequest;

            pRequest.twRMTObjectIx = this.pModel.twRMTObjectIx;
            pRequest.dX            = this.vPosition.dX;
            pRequest.dY            = this.vPosition.dY;
            pRequest.dZ            = this.vPosition.dZ;
            pRequest.sText         = this.sText;

            pIAction.Send (this, onResponse);
         }
      }

      var n;

      if ((n = sText.indexOf (',')) >= 0)
         sText = sText.slice (0, n);
      sText = sText.toLowerCase ();

      if (this.sText != sText)
      {
         this.Cancel ();

         this.sText = sText;

         this.tInput = setTimeout (onTimeout.bind (this), 250);
      }
   }
}

MV.MVRP.Map.RMPOBJECT = class extends MV.MVMF.MODEL_OBJECT
{
   static factory ()
   {
      return new this.FACTORY ('RMPObject');
   }

   constructor (pReference, pSource)
   {
      super (pReference, pSource);

      this.twRMPObjectIx = pReference.twObjectIx;

      this.pName      = new MV.MVRP.Map.Class.RMPOBJECT_NAME      ();
      this.pType      = new MV.MVRP.Map.Class.RMCOMMON_TYPE       ();
      this.pOwner     = new MV.MVRP.Map.Class.RMCOMMON_OWNER      ();
      this.pResource  = new MV.MVRP.Map.Class.RMCOMMON_RESOURCE   ();
      this.pTransform = new MV.MVRP.Map.Class.RMCOMMON_TRANSFORM  ();
      this.pBound     = new MV.MVRP.Map.Class.RMCOMMON_BOUND      ();
   }

   destructor ()
   {
      this.pName      = this.pName     .destructor ();
      this.pType      = this.pType     .destructor ();
      this.pOwner     = this.pOwner    .destructor ();
      this.pResource  = this.pResource .destructor ();
      this.pTransform = this.pTransform.destructor ();
      this.pBound     = this.pBound    .destructor ();

      return super.destructor ();
   }

   Request (sAction)
   {
      let pIAction = super.Request (sAction);
      if (pIAction)
      {
         let pRequest = pIAction.pRequest;

         if ('twRMPObjectIx' in pRequest)
            pRequest.twRMPObjectIx = this.twRMPObjectIx;
      }

      return pIAction;
   }
}

MV.MVRP.Map.RMPOBJECT.FACTORY = class extends MV.MVMF.MODEL_OBJECT.FACTORY
{

   Reference (asArgs)
   {
      let twRMPObjectIx = Number (asArgs[0]);

      return new MV.MVRP.Map.RMPOBJECT.IREFERENCE (this.sID, twRMPObjectIx);
   }
}

MV.MVRP.Map.RMPOBJECT.IREFERENCE = class extends MV.MVMF.MODEL_OBJECT.IREFERENCE
{

   Create (pSource)
   {
      return new MV.MVRP.Map.RMPOBJECT (this, pSource);
   }
}

MV.MVRP.Map.Package.MAP_IO = class extends MV.MVMF.PLUGIN.PACKAGE
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVIO',
         'Map',

         {
            aService  : [
                           'MVIO/MVIO',
                        ],
            aModel    : [
                           'MVRP_Dev/Session_RP1',

                           'MVRP_Map/RMRoot',
                           'MVRP_Map/RMCObject',
                           'MVRP_Map/RMTObject',
                           'MVRP_Map/RMPObject',
                        ],
            aSource   : [
                           'MVRP_Dev/MVIO:Session_RP1',

                           'MVRP_Map/MVIO:RMRoot',
                           'MVRP_Map/MVIO:RMCObject',
                           'MVRP_Map/MVIO:RMTObject',
                           'MVRP_Map/MVIO:RMPObject',
                        ]
         }
      );
   }

}

MV.MVRP.Map.Package.MAP_IO.FACTORY = class extends MV.MVMF.PLUGIN.PACKAGE.FACTORY
{

   Reference (sNamespace)
   {
      return new MV.MVRP.Map.Package.MAP_IO.IREFERENCE (this.sID, sNamespace, this.pConfig);
   }
}

MV.MVRP.Map.Package.MAP_IO.IREFERENCE = class extends MV.MVMF.PLUGIN.PACKAGE.IREFERENCE
{

   Create (pParam)
   {
      return new MV.MVRP.Map.Package.MAP_IO (this, pParam);
   }
}

MV.MVRP.Map.Package.MAP_REST = class extends MV.MVMF.PLUGIN.PACKAGE
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVRest',
         'Map',

         {
            aService  : [
                           'MVRest/MVRest',
                        ],
            aModel    : [
                           'MVRP_Dev/Session_RP1',

                           'MVRP_Map/RMRoot',
                           'MVRP_Map/RMCObject',
                           'MVRP_Map/RMTObject',
                           'MVRP_Map/RMPObject',
                        ],
            aSource   : [
                           'MVRP_Dev/MVRest:Session_RP1',

                           'MVRP_Map/MVRest:RMRoot',
                           'MVRP_Map/MVRest:RMCObject',
                           'MVRP_Map/MVRest:RMTObject',
                           'MVRP_Map/MVRest:RMPObject',
                        ]
         }
      );
   }

}

MV.MVRP.Map.Package.MAP_REST.FACTORY = class extends MV.MVMF.PLUGIN.PACKAGE.FACTORY
{

   Reference (sNamespace)
   {
      return new MV.MVRP.Map.Package.MAP_REST.IREFERENCE (this.sID, sNamespace, this.pConfig);
   }
}

MV.MVRP.Map.Package.MAP_REST.IREFERENCE = class extends MV.MVMF.PLUGIN.PACKAGE.IREFERENCE
{

   Create (pParam)
   {
      return new MV.MVRP.Map.Package.MAP_REST (this, pParam);
   }
}

MV.MVRP.Map.Package.MAP_SB = class extends MV.MVMF.PLUGIN.PACKAGE
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVSB',
         'Map',

         {
            aService  : [
                           'MVSB/MVSB',
                        ],
            aModel    : [
                           'MVRP_Dev/Session_RP1',

                           'MVRP_Map/RMRoot',
                           'MVRP_Map/RMCObject',
                           'MVRP_Map/RMTObject',
                           'MVRP_Map/RMPObject',
                        ],
            aSource   : [

                           'MVRP_Map/MVSB:RMRoot',
                           'MVRP_Map/MVSB:RMCObject',
                           'MVRP_Map/MVSB:RMTObject',
                           'MVRP_Map/MVSB:RMPObject',
                        ]
         }
      );
   }

}

MV.MVRP.Map.Package.MAP_SB.FACTORY = class extends MV.MVMF.PLUGIN.PACKAGE.FACTORY
{

   Reference (sNamespace)
   {
      return new MV.MVRP.Map.Package.MAP_SB.IREFERENCE (this.sID, sNamespace, this.pConfig);
   }
}

MV.MVRP.Map.Package.MAP_SB.IREFERENCE = class extends MV.MVMF.PLUGIN.PACKAGE.IREFERENCE
{

   Create (pParam)
   {
      return new MV.MVRP.Map.Package.MAP_SB (this, pParam);
   }
}

MV.MVRP.Map.Install = function (pCore, pPlugin)
{
   let bResult = true;

   if (this.pRequire = pCore.Require ('MVRP_Dev'))
   {
      this.apFactory_Model =
      [
         MV.MVRP.Map.RMROOT        .factory (),
         MV.MVRP.Map.RMCOBJECT     .factory (),
         MV.MVRP.Map.RMTOBJECT     .factory (),
         MV.MVRP.Map.RMPOBJECT     .factory (),
      ];

      this.apFactory_Source =
      [
         MV.MVRP.Map.SB_RMROOT     .factory (),
         MV.MVRP.Map.SB_RMCOBJECT  .factory (),
         MV.MVRP.Map.SB_RMTOBJECT  .factory (),
         MV.MVRP.Map.SB_RMPOBJECT  .factory (),

         MV.MVRP.Map.REST_RMROOT   .factory (),
         MV.MVRP.Map.REST_RMCOBJECT.factory (),
         MV.MVRP.Map.REST_RMTOBJECT.factory (),
         MV.MVRP.Map.REST_RMPOBJECT.factory (),

         MV.MVRP.Map.IO_RMROOT     .factory (),
         MV.MVRP.Map.IO_RMCOBJECT  .factory (),
         MV.MVRP.Map.IO_RMTOBJECT  .factory (),
         MV.MVRP.Map.IO_RMPOBJECT  .factory ()
      ];

      this.apFactory_Package =
      [
         MV.MVRP.Map.Package.MAP_SB  .factory (),
         MV.MVRP.Map.Package.MAP_REST.factory (),
         MV.MVRP.Map.Package.MAP_IO  .factory ()
      ];

      pPlugin.Factory_Models   (this.apFactory_Model);
      pPlugin.Factory_Sources  (this.apFactory_Source);
      pPlugin.Factory_Packages (this.apFactory_Package);
   }
   else bResult = false;

   return bResult;
}

MV.MVRP.Map.Unstall = function (pCore, pPlugin)
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

