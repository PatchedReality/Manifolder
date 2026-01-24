
/*
import { MV   } from '@metaversalcorp/mvmf';
import '@metaversalcorp/mvrp';
import '@metaversalcorp/mvrp_dev';

*/
/*
const { MV   } = require ('@metaversalcorp/mvmf');
require ('@metaversalcorp/mvrp');
require ('@metaversalcorp/mvrp_dev');
*/

MV.MVRP.Fabric = MV.Library ('MVRP_Fabric', 'Copyright 2023-2024 Metaversal Corporation. All rights reserved.', 'Metaversal RP1 Fabric', '0.23.2');

MV.MVRP.Fabric.IO_RFROOT = class extends MV.MVIO.IO_OBJECT
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVIO',
         'RFRoot',

         10,

         MV.MVRP.Fabric.IO_RFROOT.apAction,

         true
      );
   }

   Map_Read (pModel)
   {
      this.pModel.bOnline           = this.pData.bOnline;
   }
}

MV.MVRP.Fabric.IO_RFROOT.FACTORY = class extends MV.MVIO.IO_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVRP.Fabric.IO_RFROOT (this.pReference, pClient);
   }
}

MV.MVRP.Fabric.IO_RFROOT.apAction =
{
   RFFRIEND_REQUEST           : new MV.MVIO.SERVICE.CLIENT.ACTION
                              (
                                 'RFRoot:rffriend-request',
                                 {
                                    twRPersonaIx_Friend : 0,
                                 }
                              ),

   RFFRIEND_REQUEST_INVITATION     : new MV.MVIO.SERVICE.CLIENT.ACTION
                              (
                                 'RFRoot:rffriend-request-invitation',
                                 {
                                    sRFInvitationId : ''
                                 }
                              ),

   RFFRIEND_MEETUP_INVITATION      : new MV.MVIO.SERVICE.CLIENT.ACTION
                              (
                                 'RFRoot:rffriend-meetup-invitation',
                                 {
                                    sRFInvitationId : '',
                                    wsMessage   : ''
                                 }
                              ),

   RFFRIEND_SUMMON_INVITATION      : new MV.MVIO.SERVICE.CLIENT.ACTION
                              (
                                 'RFRoot:rffriend-summon-invitation',
                                 {
                                    sRFInvitationId : ''
                                 }
                              ),

   RFGROUP_CREATE             : new MV.MVIO.SERVICE.CLIENT.ACTION
                              (
                                 'RFRoot:rfgroup-create',
                                 {
                                    dRadius             : 0,
                                    bFlags              : 0,
                                 }
                              ),

   RFGROUP_REQUEST            : new MV.MVIO.SERVICE.CLIENT.ACTION
                              (
                                 'RFRoot:rfgroup-request',
                                 {
                                    twRPersonaIx_Leader : 0,
                                 }
                              ),

   RFGROUP_PREREQUEST         : new MV.MVIO.SERVICE.CLIENT.ACTION
                              (
                                 'RFRoot:rfgroup-prerequest',
                                 {
                                    twRPersonaIx_Leader : 0,
                                 }
                              ),

   RFCHAT_CREATE              : new MV.MVIO.SERVICE.CLIENT.ACTION
                              (
                                 'RFRoot:rfchat-create',
                                 {
                                 }
                              ),

   RFTELEPORT_CREATE          : new MV.MVIO.SERVICE.CLIENT.ACTION
                              (
                                 'RFRoot:rfteleport-create',
                                 {
                                    wsMessage            : ''
                                 }
                              ),

   ONLINE                     : new MV.MVIO.SERVICE.CLIENT.ACTION
                              (
                                 'RFRoot:online',
                                 {
                                 }
                              ),

   RFMEETING_CREATE           : new MV.MVIO.SERVICE.CLIENT.ACTION
                              (
                                 'RFRoot:rfmeeting-create',
                                 {
                                    wsName               : '',
                                    tStart                : 0,
                                    txDuration            : 0,
                                    nSize                 : 0,
                                    nScene                : 0,
                                    sPassword            : ''
                                 }
                              ),

   RFMEETING_DESTROY          : new MV.MVIO.SERVICE.CLIENT.ACTION
                              (
                                 'RFRoot:rfmeeting-destroy',
                                 {
                                    twRFMeetingIx         : 0,
                                 }
                              ),

   RFMEETING_MODIFY           : new MV.MVIO.SERVICE.CLIENT.ACTION
                              (
                                 'RFMeeting:modify',
                                 {
                                    twRFMeetingIx         : 0,
                                    wsName               : '',
                                    tStart                : 0,
                                    txDuration            : 0,
                                    nSize                 : 0,
                                    nScene                : 0,
                                    sPassword            : ''
                                 }
                              ),

   RFMEETING_MODIFY_RUNNING   : new MV.MVIO.SERVICE.CLIENT.ACTION
                              (
                                 'RFMeeting:modify_running',
                                 {
                                    twRFMeetingIx         : 0,
                                    wsName               : '',
                                    sPassword            : ''
                                 }
                              ),

   RFMEETING_START            : new MV.MVIO.SERVICE.CLIENT.ACTION
                              (
                                 'RFMeeting:start',
                                 {
                                    twRFMeetingIx         : 0
                                 }
                              ),

   RFMEETING_DECODE           : new MV.MVIO.SERVICE.CLIENT.ACTION
                              (
                                 'RFRoot:rfmeeting-decode',
                                 {
                                    sRFMeetingId         : ''
                                 }
                              ),

   RFMEETING_ENCODE           : new MV.MVIO.SERVICE.CLIENT.ACTION
                              (
                                 'RFMeeting:encode',
                                 {
                                    twRFMeetingIx         : 0
                                 }
                              ),

   RFMEETING_END              : new MV.MVIO.SERVICE.CLIENT.ACTION
                              (
                                 'RFMeeting:end',
                                 {
                                    twRFMeetingIx         : 0
                                 }
                              ),

   RFMEETING_JOIN             : new MV.MVIO.SERVICE.CLIENT.ACTION
                              (
                                 'RFMeeting:join',
                                 {
                                    sRFMeetingId         : '',
                                    sPassword            : ''
                                 }
                              ),

   RFMEETING_EXTEND           : new MV.MVIO.SERVICE.CLIENT.ACTION
                              (
                                 'RFMeeting:extend',
                                 {
                                    twRFMeetingIx         : 0,
                                    nDuration             : 0
                                 }
                              ),

   RFINVITATION_CREATE        : new MV.MVIO.SERVICE.CLIENT.ACTION
                              (
                                 'RFInvitation:create',
                                 {
                                    twRFInvitationIx      : 0,
                                    nDuration             : 0,
                                    bFriendRequestAllowed : 0,
                                    bMeetupAllowed        : 0,
                                    bAutoAcceptMeetup     : 0,
                                    bSummonAllowed        : 0
                                 }
                              ),

   RFINVITATION_DELETE        : new MV.MVIO.SERVICE.CLIENT.ACTION
                              (
                                 'RFInvitation:delete',
                                 {
                                    twRFInvitationIx          : 0
                                 }
                              ),

   RFINVITATION_ENCODE        : new MV.MVIO.SERVICE.CLIENT.ACTION
                              (
                                 'RFInvitation:encode',
                                 {
                                    twRFInvitationIx          : 0
                                 }
                              ),

   RFINVITATION_DECODE        : new MV.MVIO.SERVICE.CLIENT.ACTION
                              (
                                 'RFInvitation:decode',
                                 {
                                    sRFInvitationId          : ''
                                 }
                              )
};

MV.MVRP.Fabric.IO_RFROOT_RFCHAT = class extends MV.MVIO.IO_OBJECT
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVIO',
         'RFRoot_RFChat',

         14,

         MV.MVRP.Fabric.IO_RFROOT_RFCHAT.apAction,

         false
      );
   }

   Map_Read (pModel)
   {
      this.pModel.twRPersonaIx     = this.pData.twRPersonaIx;
      this.pModel.bState           = this.pData.bState;
   }
}

MV.MVRP.Fabric.IO_RFROOT_RFCHAT.FACTORY = class extends MV.MVIO.IO_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVRP.Fabric.IO_RFROOT_RFCHAT (this.pReference, pClient);
   }
}

MV.MVRP.Fabric.IO_RFROOT_RFGROUP = class extends MV.MVIO.IO_OBJECT
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVIO',
         'RFRoot_RFGroup',

         13,

         MV.MVRP.Fabric.IO_RFROOT_RFGROUP.apAction,

         false
      );
   }

   Map_Read (pModel)
   {
      this.pModel.twRPersonaIx         = this.pData.twRPersonaIx;
      this.pModel.twRPersonaIx_Owner   = this.pData.twRPersonaIx_Owner;
      this.pModel.bState               = this.pData.bState;
   }
}

MV.MVRP.Fabric.IO_RFROOT_RFGROUP.FACTORY = class extends MV.MVIO.IO_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVRP.Fabric.IO_RFROOT_RFGROUP (this.pReference, pClient);
   }
}

MV.MVRP.Fabric.IO_RFROOT_RFGROUP.apAction =
{
   REMOVE   :  new MV.MVIO.SERVICE.CLIENT.ACTION
               (
                  'RFGroup:remove',
                  {
                     twRFGroupIx         : 0,
                  }
               )
};

MV.MVRP.Fabric.IO_RFROOT_RFTELEPORT = class extends MV.MVIO.IO_OBJECT
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVIO',
         'RFRoot_RFTeleport',

         15,

         MV.MVRP.Fabric.IO_RFROOT_RFTELEPORT.apAction,

         false
      );
   }

   Map_Read (pModel)
   {
      this.pModel.twRPersonaIx     = this.pData.twRPersonaIx;
      this.pModel.bState           = this.pData.bState;
      this.pModel.bType            = this.pData.bType;
   }
}

MV.MVRP.Fabric.IO_RFROOT_RFTELEPORT.FACTORY = class extends MV.MVIO.IO_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVRP.Fabric.IO_RFROOT_RFTELEPORT (this.pReference, pClient);
   }
}

MV.MVRP.Fabric.IO_RFROOT_RFTELEPORT.apAction =
{
   REMOVE   :  new MV.MVIO.SERVICE.CLIENT.ACTION
               (
                  'RFTeleport:remove',
                  {
                     twRFTeleportIx         : 0,
                  }
               )
};

MV.MVRP.Fabric.IO_RFFRIEND = class extends MV.MVIO.IO_OBJECT
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVIO',
         'RFFriend',

         12,

         MV.MVRP.Fabric.IO_RFFRIEND.apAction,

         false
      );
   }

   Map_Read (pModel)
   {
      this.pModel.bOnline           = this.pData.bOnline;
      this.pModel.bState            = this.pData.bState;
      this.pModel.bRating           = this.pData.bRating;
      this.pModel.wsNotes           = this.pData.wsNotes;
   }
}

MV.MVRP.Fabric.IO_RFFRIEND.FACTORY = class extends MV.MVIO.IO_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVRP.Fabric.IO_RFFRIEND (this.pReference, pClient);
   }
}

MV.MVRP.Fabric.IO_RFFRIEND.apAction =
{
   ACCEPT   :  new MV.MVIO.SERVICE.CLIENT.ACTION
               (
                  'RFFriend:accept',
                  {
                     twRPersonaIx_Friend : 0,
                  }
               ),

   DECLINE  :  new MV.MVIO.SERVICE.CLIENT.ACTION
               (
                  'RFFriend:decline',
                  {
                     twRPersonaIx_Friend : 0,
                  }
               ),

   BLOCK    :  new MV.MVIO.SERVICE.CLIENT.ACTION
               (
                  'RFFriend:block',
                  {
                     twRPersonaIx_Friend : 0,
                  }
               ),

   DELETE   :  new MV.MVIO.SERVICE.CLIENT.ACTION
               (
                  'RFFriend:delete',
                  {
                     twRPersonaIx_Friend : 0,
                  }
               ),

   FIND     :  new MV.MVIO.SERVICE.CLIENT.ACTION
               (
                  'RFFriend:find',
                  {
                     twRPersonaIx_Friend : 0,
                  }
               ),

   RATING   :  new MV.MVIO.SERVICE.CLIENT.ACTION
               (
                  'RFFriend:rating',
                  {
                     twRPersonaIx_Friend : 0,
                     bRating             : 0,
                  }
               ),

   NOTE     :  new MV.MVIO.SERVICE.CLIENT.ACTION
               (
                  'RFFriend:note',
                  {
                     twRPersonaIx_Friend : 0,
                     wsNotes            : '',
                  }
               ),

   SUMMON   :  new MV.MVIO.SERVICE.CLIENT.ACTION
               (
                  'RFFriend:summon',
                  {
                     twRPersonaIx_Friend : 0,
                     twRFTeleportIx      : 0,
                  }
               ),

   MEETUP   :  new MV.MVIO.SERVICE.CLIENT.ACTION
               (
                  'RFFriend:meetup',
                  {
                     twRPersonaIx_Friend : 0,
                     wsMessage          : '',
                  }
               )
};

MV.MVRP.Fabric.IO_RFGROUP = class extends MV.MVIO.IO_OBJECT
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVIO',
         'RFGroup',

         30,

         MV.MVRP.Fabric.IO_RFGROUP.apAction,

         true
      );
   }

   Map_Read (pModel)
   {
      this.pModel.twRPersonaIx_Owner = this.pData.twRPersonaIx_Owner;
      this.pModel.dRadius            = this.pData.dRadius;
      this.pModel.bFlags             = this.pData.bFlags;
   }
}

MV.MVRP.Fabric.IO_RFGROUP.FACTORY = class extends MV.MVIO.IO_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVRP.Fabric.IO_RFGROUP (this.pReference, pClient);
   }
}

MV.MVRP.Fabric.IO_RFGROUP.apAction =
{
   DESTROY  :  new MV.MVIO.SERVICE.CLIENT.ACTION
               (
                  'RFGroup:destroy',
                  {
                     twRFGroupIx         : 0,
                  }
               ),

   MODIFY   :  new MV.MVIO.SERVICE.CLIENT.ACTION
               (
                  'RFGroup:modify',
                  {
                     twRFGroupIx         : 0,
                     dRadius             : 0,
                     bFlags              : 0,
                  }
               ),

   REMOVE   :  new MV.MVIO.SERVICE.CLIENT.ACTION
               (
                  'RFGroup:remove',
                  {
                     twRFGroupIx         : 0,
                  }
               ),

   INVITE   :  new MV.MVIO.SERVICE.CLIENT.ACTION
               (
                  'RFGroup:invite',
                  {
                     twRFGroupIx         : 0,
                     twRPersonaIx_Member : 0,
                  }
               ),

   SUMMON   :  new MV.MVIO.SERVICE.CLIENT.ACTION
               (
                  'RFGroup:summon',
                  {
                     twRFGroupIx         : 0,
                     twRFTeleportIx      : 0,
                     sRPersonaIx_List   : null
                  }
               ),

   MUTE     :  new MV.MVIO.SERVICE.CLIENT.ACTION
               (
                  'RFGroup:mute',
                  {
                     twRFGroupIx         : 0,
                     twRPersonaIx_Member : 0,
                  }
               )
};

MV.MVRP.Fabric.IO_RFGROUP_RFMEMBER = class extends MV.MVIO.IO_OBJECT
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVIO',
         'RFGroup_RFMember',

         31,

         MV.MVRP.Fabric.IO_RFGROUP_RFMEMBER.apAction,

         false
      );
   }

   Map_Read (pModel)
   {
      this.pModel.bState       = this.pData.bState;
      this.pModel.bLeader      = this.pData.bLeader;
   }
}

MV.MVRP.Fabric.IO_RFGROUP_RFMEMBER.FACTORY = class extends MV.MVIO.IO_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVRP.Fabric.IO_RFGROUP_RFMEMBER (this.pReference, pClient);
   }
}

MV.MVRP.Fabric.IO_RFGROUP_RFMEMBER.apAction =
{
    PROMOTE :  new MV.MVIO.SERVICE.CLIENT.ACTION
               (
                  'RFMember:promote',
                  {
                     twRFGroupIx         : 0,
                     twRPersonaIx_Leader : 0,
                  }
               ),

    DEMOTE  :  new MV.MVIO.SERVICE.CLIENT.ACTION
               (
                  'RFMember:demote',
                  {
                     twRFGroupIx         : 0,
                     twRPersonaIx_Leader : 0,
                  }
               ),

    ACCEPT  :  new MV.MVIO.SERVICE.CLIENT.ACTION
               (
                  'RFMember:accept',
                  {
                     twRFGroupIx         : 0,
                     twRPersonaIx_Member : 0,
                  }
               ),

    DECLINE :  new MV.MVIO.SERVICE.CLIENT.ACTION
               (
                  'RFMember:decline',
                  {
                     twRFGroupIx         : 0,
                     twRPersonaIx_Member : 0,
                  }
               ),

    BLOCK   :  new MV.MVIO.SERVICE.CLIENT.ACTION
               (
                  'RFMember:block',
                  {
                     twRFGroupIx         : 0,
                     twRPersonaIx_Member : 0,
                  }
               ),

    DELETE  :  new MV.MVIO.SERVICE.CLIENT.ACTION
               (
                  'RFMember:delete',
                  {
                     twRFGroupIx         : 0,
                     twRPersonaIx_Member : 0,
                  }
               ),

    MEETUP  :  new MV.MVIO.SERVICE.CLIENT.ACTION
               (
                  'RFMember:meetup',
                  {
                     twRFGroupIx         : 0,
                     twRPersonaIx_Member : 0,
                     wsMessage          : '',
                  }
               ),
};

MV.MVRP.Fabric.IO_RFTELEPORT = class extends MV.MVIO.IO_OBJECT
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVIO',
         'RFTeleport',

         50,

         MV.MVRP.Fabric.IO_RFTELEPORT.apAction,

         true
      );
   }

   Map_Read (pModel)
   {
      this.pModel.twRPersonaIx_Owner = this.pData.twRPersonaIx_Owner;
      this.pModel.bType              = this.pData.bType;
      this.pModel.wsMessage          = this.pData.wsMessage;
      this.pModel.dwCount_RFTarget   = this.pData.dwCount_RFTarget;

      this.pModel.wClass             = this.pData.wClass;
      this.pModel.twObjectIx_Dest    = this.pData.twObjectIx;
      this.pModel.Position_dX        = this.pData.Position_dX;
      this.pModel.Position_dY        = this.pData.Position_dY;
      this.pModel.Position_dZ        = this.pData.Position_dZ;
      this.pModel.Rotation_dwV       = this.pData.Rotation_dwV;
   }
}

MV.MVRP.Fabric.IO_RFTELEPORT.FACTORY = class extends MV.MVIO.IO_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVRP.Fabric.IO_RFTELEPORT (this.pReference, pClient);
   }
}

MV.MVRP.Fabric.IO_RFTELEPORT.apAction = {};

MV.MVRP.Fabric.IO_RFTELEPORT.apAction['DESTROY'] = new MV.MVIO.SERVICE.CLIENT.ACTION
(
   'RFTeleport:destroy',
   {
      twRFTeleportIx         : 0,
   }
);

MV.MVRP.Fabric.IO_RFTELEPORT.apAction['DECLINE'] = new MV.MVIO.SERVICE.CLIENT.ACTION
(
   'RFTeleport:decline',
   {
      twRFTeleportIx         : 0,
      wsMessage             : '',
   }
);

MV.MVRP.Fabric.IO_RFTELEPORT.apAction['ACCEPT_MEETUP'] = new MV.MVIO.SERVICE.CLIENT.ACTION
(
   'RFTeleport:accept_meetup',
   {
      twRFTeleportIx         : 0
   }
);

MV.MVRP.Fabric.IO_RFTELEPORT.apAction['ACCEPT_SUMMON'] = new MV.MVIO.SERVICE.CLIENT.ACTION
(
   'RFTeleport:accept_summon',
   {
      twRFTeleportIx         : 0
   }
);

MV.MVRP.Fabric.IO_RFTELEPORT_RFTARGET = class extends MV.MVIO.IO_OBJECT
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVIO',
         'RFTeleport_RFTarget',

         51,

         MV.MVRP.Fabric.IO_RFTELEPORT_RFTARGET.apAction,

         false
      );
   }

   Map_Read (pModel)
   {
      this.pModel.bState       = this.pData.bState;
      this.pModel.wsMessage    = this.pData.wsMessage;
   }
}

MV.MVRP.Fabric.IO_RFTELEPORT_RFTARGET.FACTORY = class extends MV.MVIO.IO_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVRP.Fabric.IO_RFTELEPORT_RFTARGET (this.pReference, pClient);
   }
}

MV.MVRP.Fabric.IO_RFMEETING = class extends MV.MVIO.IO_OBJECT
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVIO',
         'RFMeeting',

         60,

         MV.MVRP.Fabric.IO_RFMEETING.apAction,

         true
      );
   }

   Map_Read (pModel)
   {
      this.pModel.twRFGroupIx        = this.pData.twRFGroupIx;
      this.pModel.sLocation          = this.pData.sLocation;
      this.pModel.wsName             = this.pData.wsName;
      this.pModel.dtStart            = this.pData.dtStart;
      this.pModel.dtEnd              = this.pData.dtEnd;
      this.pModel.nSize              = this.pData.nSize;
      this.pModel.nScene             = this.pData.nScene;
      this.pModel.sPassword          = this.pData.sPassword;
      this.pModel.bState             = this.pData.bState;
   }
}

MV.MVRP.Fabric.IO_RFMEETING.FACTORY = class extends MV.MVIO.IO_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVRP.Fabric.IO_RFMEETING (this.pReference, pClient);
   }
}

MV.MVRP.Fabric.IO_RFMEETING.apAction =
{
   START    :  new MV.MVIO.SERVICE.CLIENT.ACTION
               (
                  'RFMeeting:start',
                  {
                     twRFMeetingIx         : 0
                  }
               ),
   EXTEND   :  new MV.MVIO.SERVICE.CLIENT.ACTION
               (
                  'RFMeeting:extend',
                  {
                     twRFMeetingIx         : 0,
                     nDuration             : 0
                  }
               ),

   MODIFY   :  new MV.MVIO.SERVICE.CLIENT.ACTION
               (
                  'RFMeeting:modify',
                  {
                     twRFMeetingIx         : 0,
                     wsName               : '',
                     dtStart               : 0,
                     dtEnd                 : 0,
                     nSize                 : 0,
                     nScene                : 0
                  }
               ),

   MODIFY_RUNNING   :  new MV.MVIO.SERVICE.CLIENT.ACTION
               (
                  'RFMeeting:modify_running',
                  {
                     twRFMeetingIx         : 0,
                     wsName               : '',
                     sPassword            : ''
                  }
               ),

   ENCODE   :  new MV.MVIO.SERVICE.CLIENT.ACTION
               (
                  'RFMeeting:encode',
                  {
                     twRFMeetingIx         : 0
                  }
               ),

   END      :  new MV.MVIO.SERVICE.CLIENT.ACTION
               (
                  'RFMeeting:end',
                  {
                     twRFMeetingIx         : 0
                  }
               )
};

MV.MVRP.Fabric.IO_RFCHAT = class extends MV.MVIO.IO_OBJECT
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVIO',
         'RFChat',

         40,

         MV.MVRP.Fabric.IO_RFCHAT.apAction,

         true
      );
   }

   Map_Read (pModel)
   {
      this.pModel.dwCount_RFMember           = this.pData.dwCount_RFMember;
   }
}

MV.MVRP.Fabric.IO_RFCHAT.FACTORY = class extends MV.MVIO.IO_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVRP.Fabric.IO_RFCHAT (this.pReference, pClient);
   }
}

MV.MVRP.Fabric.IO_RFCHAT.apAction =
{
   ADD      :  new MV.MVIO.SERVICE.CLIENT.ACTION
               (
                  'RFChat:add',
                  {
                     twRFChatIx :       0,
                     sRPersonaIx_List: ''
                  }
               ),

   ACCEPT   :  new MV.MVIO.SERVICE.CLIENT.ACTION
               (
                  'RFChat:accept',
                  {
                     twRFChatIx :       0
                  }
               ),

   REMOVE   :  new MV.MVIO.SERVICE.CLIENT.ACTION
               (
                  'RFChat:remove',
                  {
                     twRFChatIx :       0
                  }
               ),

   MESSAGE  :  new MV.MVIO.SERVICE.CLIENT.ACTION
               (
                  'RFChat:message',
                  {
                     twRFChatIx :       0,
                     wsMessage :       ''
                  }
               ),

   SUMMON   :  new MV.MVIO.SERVICE.CLIENT.ACTION
               (
                  'RFChat:summon',
                  {
                     twRFChatIx          : 0,
                     twRFTeleportIx      : 0,
                     sRPersonaIx_List      : null
                  }
               )
};

MV.MVRP.Fabric.IO_RFCHAT_RFMEMBER = class extends MV.MVIO.IO_OBJECT
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVIO',
         'RFChat_RFMember',

         41,

         MV.MVRP.Fabric.IO_RFCHAT_RFMEMBER.apAction,

         false
      );
   }

   Map_Read (pModel)
   {
      this.pModel.bState             = this.pData.bState;
      this.pModel.twRPersonaIx_Adder = this.pData.twRPersonaIx_Adder;
   }
}

MV.MVRP.Fabric.IO_RFCHAT_RFMEMBER.FACTORY = class extends MV.MVIO.IO_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVRP.Fabric.IO_RFCHAT_RFMEMBER (this.pReference, pClient);
   }
}

MV.MVRP.Fabric.IO_RFCHAT_RFMEMBER.apAction =
{
   MEETUP   :  new MV.MVIO.SERVICE.CLIENT.ACTION
               (
                  'RFChat:meetup',
                  {
                     twRFChatIx          : 0,
                     twRPersonaIx_Member : 0,
                     wsMessage          : '',
                  }
               )
};

MV.MVRP.Fabric.IO_RFCHAT_RFMESSAGE = class extends MV.MVIO.IO_OBJECT
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVIO',
         'RFChat_RFMessage',

         42,

         MV.MVRP.Fabric.IO_RFCHAT_RFMESSAGE.apAction,

         false
      );
   }

   Map_Read (pModel)
   {
      this.pModel.dtCreated    = this.pData.dtCreated;
      this.pModel.twRPersonaIx = this.pData.twRPersonaIx;
      this.pModel.wsMessage    = this.pData.wsMessage;
   }
}

MV.MVRP.Fabric.IO_RFCHAT_RFMESSAGE.FACTORY = class extends MV.MVIO.IO_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVRP.Fabric.IO_RFCHAT_RFMESSAGE (this.pReference, pClient);
   }
}

MV.MVRP.Fabric.IO_RFINVITATION = class extends MV.MVIO.IO_OBJECT
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVIO',
         'RFInvitation',

         70,

         MV.MVRP.Fabric.IO_RFINVITATION.apAction,

         true
      );
   }

   Map_Read (pModel)
   {
      this.pModel.twRFInvitationIx      = this.pData.twRFInvitationIx;
      this.pModel.bFriendRequestAllowed = this.pData.bFriendRequestAllowed;
      this.pModel.bMeetupAllowed        = this.pData.bMeetupAllowed;
      this.pModel.bAutoAcceptMeetup     = this.pData.bAutoAcceptMeetup;
      this.pModel.bSummonAllowed        = this.pData.bSummonAllowed;
      this.pModel.dtExpiry              = this.pData.dtExpiry;
   }
}

MV.MVRP.Fabric.IO_RFINVITATION.FACTORY = class extends MV.MVIO.IO_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVRP.Fabric.IO_RFINVITATION (this.pReference, pClient);
   }
}

MV.MVRP.Fabric.REST_RPERSONA_CACHE = class extends MV.MVRest.REST_OBJECT
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVRest',
         'RPersona_Cache',

         1,

         MV.MVRP.Fabric.REST_RPERSONA_CACHE.apAction,

         true
      );
   }

}

MV.MVRP.Fabric.REST_RPERSONA_CACHE.FACTORY = class extends MV.MVRest.REST_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVRP.Fabric.REST_RPERSONA_CACHE (this.pReference, pClient);
   }
}

MV.MVRP.Fabric.REST_RPERSONA_CACHE.apAction =
{
   FETCH          :  new MV.MVRest.SERVICE.CLIENT.ACTION
                     (
                        'rproot/fetch',
                        {
                           sPersonaIx_List : ''
                        },
                        MV.MVRest.POST_JSON
                     ),

   LOOKUP         :  new MV.MVRest.SERVICE.CLIENT.ACTION
                     (
                        'rproot/lookup',
                        {
                           wsForename    : '',
                           wsSurname     : '',
                           dwSequence     : 0,
                        },
                        MV.MVRest.POST_JSON
                     ),

   AVATAR         :  new MV.MVRest.SERVICE.CLIENT.ACTION
                     (
                        'rproot/avatar',
                        {
                           nAvatarIx      : 0,
                           nSkinColor     : 0,
                           nClothingColor : 0,
                           fHeight_Mesh   : 0.0,
                           fHeight_Avatar : 0.0,
                        },
                        MV.MVRest.POST_JSON
                     ),

   ORG            :  new MV.MVRest.SERVICE.CLIENT.ACTION
                     (
                        'rproot/org',
                        {
                           wsName        : '',
                           wsTitle       : ''
                        },
                        MV.MVRest.POST_JSON
                     ),

   THUMBNAIL      :  new MV.MVRest.SERVICE.CLIENT.ACTION
                     (
                        'rproot/thumbnail',
                        {
                           twImageIx_Thumb: 0,
                        },
                        MV.MVRest.POST_JSON
                     ),

   TITLE          :  new MV.MVRest.SERVICE.CLIENT.ACTION
                     (
                        'rproot/title',
                        {
                           twRPersonaIx_User : 0,
                           wsTitle           : ''
                        },
                        MV.MVRest.POST_JSON
                     ),

   URL            :  new MV.MVRest.SERVICE.CLIENT.ACTION
                     (
                        'rproot/url',
                        {
                           sUrl          : ''
                        },
                        MV.MVRest.POST_JSON
                     ),

   ORG_URL           :  new MV.MVRest.SERVICE.CLIENT.ACTION
                     (
                        'rproot/orgurl',
                        {
                           wsName        : '',
                           wsTitle       : '',
                           sUrl          : ''
                        },
                        MV.MVRest.POST_JSON
                     ),
   CREATE            :  new MV.MVRest.SERVICE.CLIENT.ACTION
                     (
                        'rproot/create',
                        {
                        },
                        MV.MVRest.POST_JSON
                     )
}

MV.MVRP.Fabric.REST_RGLOBALREGISTRY = class extends MV.MVRest.REST_OBJECT
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVRest',
         'RGlobalRegistry',

         1,

         MV.MVRP.Fabric.REST_RGLOBALREGISTRY.apAction,

         true
      );
   }

}

MV.MVRP.Fabric.REST_RGLOBALREGISTRY.FACTORY = class extends MV.MVRest.REST_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVRP.Fabric.REST_RGLOBALREGISTRY (this.pReference, pClient);
   }
}

MV.MVRP.Fabric.REST_RGLOBALREGISTRY.apAction =
{
   GET         : new MV.MVRest.SERVICE.CLIENT.ACTION
               (
                  'rproot/get',
                  {
                  },
                  MV.MVRest.POST_JSON
               ),

   GET_DEFAULT : new MV.MVRest.SERVICE.CLIENT.ACTION
               (
                  'rproot/getdefault',
                  {
                  },
                  MV.MVRest.POST_JSON
               ),

   SET         : new MV.MVRest.SERVICE.CLIENT.ACTION
               (
                  'rproot/set',
                  {
                     wsKey   : '',
                     wsValue : ''
                  },
                  MV.MVRest.POST_JSON
               ),
}

MV.MVRP.Fabric.IO_RNROOT = class extends MV.MVIO.IO_OBJECT
{
   static factory ()
   {
      return new this.FACTORY (
         "MVIO",
         "RNRoot",

         10,

         MV.MVRP.Fabric.IO_RNROOT.apAction,

         true
      );
   }

   Map_Read (pModel)
   {
   }
};

MV.MVRP.Fabric.IO_RNROOT.FACTORY = class extends MV.MVIO.IO_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVRP.Fabric.IO_RNROOT(this.pReference, pClient);
   }
};

MV.MVRP.Fabric.IO_RNROOT.apAction =
{
};

MV.MVRP.Fabric.IO_RNNOTIFICATION = class extends MV.MVIO.IO_OBJECT
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVIO',
         'RNNotification',

         30,

         MV.MVRP.Fabric.IO_RNNOTIFICATION.apAction,

         true
      );
   }

   Map_Read (pModel)
   {
      this.pModel.twRNNotificationIx     = this.pData.twRNNotificationIx;
      this.pModel.twRDServiceIx          = this.pData.twRDServiceIx;
      this.pModel.twRDEnvironmentIx      = this.pData.twRDEnvironmentIx;
      this.pModel.twNotificationIx       = this.pData.twNotificationIx;
      this.pModel.twRPersonaIx           = this.pData.twRPersonaIx;
      this.pModel.sPayload               = this.pData.sPayload;
      this.pModel.bState                 = this.pData.bState;
   }
}

MV.MVRP.Fabric.IO_RNNOTIFICATION.FACTORY = class extends MV.MVIO.IO_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVRP.Fabric.IO_RNNOTIFICATION (this.pReference, pClient);
   }
}

MV.MVRP.Fabric.IO_RNNOTIFICATION.apAction =
{
   RNNOTIFICATION_READ :         new MV.MVIO.SERVICE.CLIENT.ACTION
                                 (
                                    "RNNotification:read",
                                    {
                                       twRNNotificationIx : 0
                                    }
                                 ),

   RNNOTIFICATION_ACTION :       new MV.MVIO.SERVICE.CLIENT.ACTION
                                 (
                                    "RNNotification:action",
                                    {
                                       twRNNotificationIx : 0,
                                       sPayload           : ''
                                    }
                                 )
};

MV.MVRP.Fabric.IO_RNROOT_RNNOTIFICATION = class extends MV.MVIO.IO_OBJECT
{
  static factory ()
  {
    return new this.FACTORY (
      "MVIO",
      "RNRoot_RNNotification",

      12,

      MV.MVRP.Fabric.IO_RNROOT_RNNOTIFICATION.apAction,

      false
    );
  }

   Map_Read (pModel)
   {
      this.pModel.twRNNotificationIx     = this.pData.twRNNotificationIx;
      this.pModel.twRDServiceIx          = this.pData.twRDServiceIx;
      this.pModel.twRDEnvironmentIx      = this.pData.twRDEnvironmentIx;
      this.pModel.twNotificationIx       = this.pData.twNotificationIx;
      this.pModel.twRPersonaIx           = this.pData.twRPersonaIx;
      this.pModel.sPayload               = this.pData.sPayload;
      this.pModel.bState                 = this.pData.bState;
   }
};

MV.MVRP.Fabric.IO_RNROOT_RNNOTIFICATION.FACTORY = class extends MV.MVIO.IO_OBJECT.FACTORY
{

   Create (pClient)
   {
      return new MV.MVRP.Fabric.IO_RNROOT_RNNOTIFICATION (this.pReference, pClient);
   }
};

MV.MVRP.Fabric.IO_RNROOT_RNNOTIFICATION.apAction =
{
};

MV.MVRP.Fabric.RFROOT = class extends MV.MVMF.MODEL_OBJECT
{
   static factory ()
   {
      return new this.FACTORY ('RFRoot');
   }

   constructor (pReference, pSource)
   {
      super (pReference, pSource);

      this.twRFRootIx = pReference.twObjectIx;
   }

   CountFriend (bOnline)
   {
      let nCount = 0;

      var cb = function (pRFFriend)
      {
         if (pRFFriend.bState == pRFFriend.eSTATE.ACCEPTED && (!bOnline || pRFFriend.bOnline == 1))
            nCount++;

         return true;
      };

      this.Child_Enum ('RFFriend', this, cb);

      return nCount;
   }

}

MV.MVRP.Fabric.RFROOT.FACTORY = class extends MV.MVMF.MODEL_OBJECT.FACTORY
{

   Reference (asArgs)
   {
      let twRFRootIx = Number (asArgs[0]);

      return new MV.MVRP.Fabric.RFROOT.IREFERENCE (this.sID, twRFRootIx);
   }
}

MV.MVRP.Fabric.RFROOT.IREFERENCE = class extends MV.MVMF.MODEL_OBJECT.IREFERENCE
{

   Create (pSource)
   {
      return new MV.MVRP.Fabric.RFROOT (this, pSource);
   }
}

MV.MVRP.Fabric.RFROOT_RFCHAT = class extends MV.MVMF.MODEL_OBJECT
{
   static factory ()
   {
      return new this.FACTORY ('RFRoot_RFChat');
   }

   constructor (pReference, pSource)
   {
      super (pReference, pSource);

      this.twRFRootIx = pReference.twObjectIx;
      this.twRFChatIx = pReference.twChildIx;
   }

   Request (sAction)
   {
      let pIAction = super.Request (sAction);
      if (pIAction)
      {
         let pRequest = pIAction.pRequest;

         if ('twRFChatIx' in pRequest)
            pRequest.twRFChatIx = this.twRFChatIx;
      }

      return pIAction;
   }
}

MV.MVRP.Fabric.RFROOT_RFCHAT.FACTORY = class extends MV.MVMF.MODEL_OBJECT.FACTORY
{

   Reference (asArgs)
   {
      let twRFRootIx = Number (asArgs[0]);
      let twRFChatIx = Number (asArgs[1]);

      return new MV.MVRP.Fabric.RFROOT_RFCHAT.IREFERENCE (this.sID, twRFRootIx, twRFChatIx);
   }
}

MV.MVRP.Fabric.RFROOT_RFCHAT.IREFERENCE = class extends MV.MVMF.MODEL_OBJECT.IREFERENCE
{

   Create (pSource)
   {
      return new MV.MVRP.Fabric.RFROOT_RFCHAT (this, pSource);
   }
}

MV.MVRP.Fabric.RFROOT_RFGROUP = class extends MV.MVMF.MODEL_OBJECT
{
   static factory ()
   {
      return new this.FACTORY ('RFRoot_RFGroup');
   }

   constructor (pReference, pSource)
   {
      super (pReference, pSource);

      this.twRFRootIx  = pReference.twObjectIx;
      this.twRFGroupIx = pReference.twChildIx;
   }

   Request (sAction)
   {
      let pIAction = super.Request (sAction);
      if (pIAction)
      {
         let pRequest = pIAction.pRequest;

         if ('twRFGroupIx' in pRequest)
            pRequest.twRFGroupIx = this.twRFGroupIx;
      }

      return pIAction;
   }
}

MV.MVRP.Fabric.RFROOT_RFGROUP.FACTORY = class extends MV.MVMF.MODEL_OBJECT.FACTORY
{

   Reference (asArgs)
   {
      let twRFRootIx  = Number (asArgs[0]);
      let twRFGroupIx = Number (asArgs[1]);

      return new MV.MVRP.Fabric.RFROOT_RFGROUP.IREFERENCE (this.sID, twRFRootIx, twRFGroupIx);
   }
}

MV.MVRP.Fabric.RFROOT_RFGROUP.IREFERENCE = class extends MV.MVMF.MODEL_OBJECT.IREFERENCE
{

   Create (pSource)
   {
      return new MV.MVRP.Fabric.RFROOT_RFGROUP (this, pSource);
   }
}

MV.MVRP.Fabric.RFROOT_RFTELEPORT = class extends MV.MVMF.MODEL_OBJECT
{
   static factory ()
   {
      return new this.FACTORY ('RFRoot_RFTeleport');
   }

   constructor (pReference, pSource)
   {
      super (pReference, pSource);

      this.twRFRootIx      = pReference.twObjectIx;
      this.twRFTeleportIx  = pReference.twChildIx;
   }

   Request (sAction)
   {
      let pIAction = super.Request (sAction);
      if (pIAction)
      {
         let pRequest = pIAction.pRequest;

         if ('twRFTeleportIx' in pRequest)
            pRequest.twRFTeleportIx = this.twRFTeleportIx;
      }

      return pIAction;
   }
}

MV.MVRP.Fabric.RFROOT_RFTELEPORT.FACTORY = class extends MV.MVMF.MODEL_OBJECT.FACTORY
{

   Reference (asArgs)
   {
      let twRFRootIx     = Number (asArgs[0]);
      let twRFTeleportIx = Number (asArgs[1]);

      return new MV.MVRP.Fabric.RFROOT_RFTELEPORT.IREFERENCE (this.sID, twRFRootIx, twRFTeleportIx);
   }
}

MV.MVRP.Fabric.RFROOT_RFTELEPORT.IREFERENCE = class extends MV.MVMF.MODEL_OBJECT.IREFERENCE
{

   Create (pSource)
   {
      return new MV.MVRP.Fabric.RFROOT_RFTELEPORT (this, pSource);
   }
}

MV.MVRP.Fabric.RFCHAT = class extends MV.MVMF.MODEL_OBJECT
{
   static factory ()
   {
      return new this.FACTORY ('RFChat');
   }

   constructor (pReference, pSource)
   {
      super (pReference, pSource);

      this.twRFChatIx = pReference.twObjectIx;
   }

   Request (sAction)
   {
      let pIAction = super.Request (sAction);
      if (pIAction)
      {
         let pRequest = pIAction.pRequest;

         if ('twRFChatIx' in pRequest)
            pRequest.twRFChatIx = this.twRFChatIx;
      }

      return pIAction;
   }
}

MV.MVRP.Fabric.RFCHAT.FACTORY = class extends MV.MVMF.MODEL_OBJECT.FACTORY
{

   Reference (asArgs)
   {
      let twRFChatIx = Number (asArgs[0]);

      return new MV.MVRP.Fabric.RFCHAT.IREFERENCE (this.sID, twRFChatIx);
   }
}

MV.MVRP.Fabric.RFCHAT.IREFERENCE = class extends MV.MVMF.MODEL_OBJECT.IREFERENCE
{

   Create (pSource)
   {
      return new MV.MVRP.Fabric.RFCHAT (this, pSource);
   }
}

MV.MVRP.Fabric.RFCHAT_RFMEMBER = class extends MV.MVMF.MODEL_OBJECT
{
   static factory ()
   {
      return new this.FACTORY ('RFChat_RFMember');
   }

   static eSTATE =
   {
      NULL      : 0,
      INVITED   : 1,
      ACCEPTED  : 2,
      CREATED   : 3
   };

   eSTATE = MV.MVRP.Fabric.RFCHAT_RFMEMBER.eSTATE;

   constructor (pReference, pSource)
   {
      super (pReference, pSource);

      this.twRFChatIx    = pReference.twObjectIx;
      this.twRPersonaIx  = pReference.twChildIx;
   }

   Request (sAction)
   {
      let pIAction = super.Request (sAction);
      if (pIAction)
      {
         let pRequest = pIAction.pRequest;

         if ('twRFChatIx' in pRequest)
            pRequest.twRFChatIx = this.twRFChatIx;
         if ('twRPersonaIx_Member' in pRequest)
            pRequest.twRPersonaIx_Member = this.twRPersonaIx;
      }

      return pIAction;
   }
}

MV.MVRP.Fabric.RFCHAT_RFMEMBER.FACTORY = class extends MV.MVMF.MODEL_OBJECT.FACTORY
{

   Reference (asArgs)
   {
      let twRFChatIx   = Number (asArgs[0]);
      let twRPersonaIx = Number (asArgs[1]);

      return new MV.MVRP.Fabric.RFCHAT_RFMEMBER.IREFERENCE (this.sID, twRFChatIx, twRPersonaIx);
   }
}

MV.MVRP.Fabric.RFCHAT_RFMEMBER.IREFERENCE = class extends MV.MVMF.MODEL_OBJECT.IREFERENCE
{

   Create (pSource)
   {
      return new MV.MVRP.Fabric.RFCHAT_RFMEMBER (this, pSource);
   }
}

MV.MVRP.Fabric.RFCHAT_RFMESSAGE = class extends MV.MVMF.MODEL_OBJECT
{
   static factory ()
   {
      return new this.FACTORY ('RFChat_RFMessage');
   }

   constructor (pReference, pSource)
   {
      super (pReference, pSource);

      this.twRFChatIx    = pReference.twObjectIx;
      this.twRFMessageIz = pReference.twChildIx;
   }

   GetTimestamp ()
   {
      let dLocal        = new Date (this.dtCreated);

      let sTxt;
      let nHours   = dLocal.getHours ();
      let nMinutes = dLocal.getMinutes ();
      let nSeconds = dLocal.getSeconds ();
      if (nHours >= 12)
      {
         sTxt = ' PM';
         nHours -= 12;
      }
      else sTxt = ' AM';

      if (nHours == 0)
         nHours = 12;
      else if (nHours < 10)
         nHours = '0' + nHours;

      if (nMinutes < 10)
         nMinutes = '0' + nMinutes;

      if (nSeconds < 10)
         nSeconds = '0' + nSeconds;

      return nHours + ':' + nMinutes + ':' + nSeconds + sTxt;
   }
}

MV.MVRP.Fabric.RFCHAT_RFMESSAGE.FACTORY = class extends MV.MVMF.MODEL_OBJECT.FACTORY
{

   Reference (asArgs)
   {
      let twRFChatIx    = Number (asArgs[0]);
      let twRFMessageIz = Number (asArgs[1]);

      return new MV.MVRP.Fabric.RFCHAT_RFMESSAGE.IREFERENCE (this.sID, twRFChatIx, twRFMessageIz);
   }
}

MV.MVRP.Fabric.RFCHAT_RFMESSAGE.IREFERENCE = class extends MV.MVMF.MODEL_OBJECT.IREFERENCE
{

   Create (pSource)
   {
      return new MV.MVRP.Fabric.RFCHAT_RFMESSAGE (this, pSource);
   }
}

MV.MVRP.Fabric.RFFRIEND = class extends MV.MVMF.MODEL_OBJECT
{
   static factory ()
   {
      return new this.FACTORY ('RFFriend');
   }

   static eSTATE =
   {
      NULL      : 0,
      BLOCKED   : 1,
      INVITED   : 2,
      REQUESTED : 3,
      ACCEPTED  : 4,
   };

   eSTATE = MV.MVRP.Fabric.RFFRIEND.eSTATE;

   constructor (pReference, pSource)
   {
      super (pReference, pSource);

      this.twRPersonaIx        = pReference.twObjectIx;
      this.twRPersonaIx_Friend = pReference.twChildIx;
   }

   Request (sAction)
   {
      let pIAction = super.Request (sAction);
      if (pIAction)
      {
         let pRequest = pIAction.pRequest;

         if ('twRPersonaIx_Friend' in pRequest)
            pRequest.twRPersonaIx_Friend = this.twRPersonaIx_Friend;
      }

      return pIAction;
   }
}

MV.MVRP.Fabric.RFFRIEND.FACTORY = class extends MV.MVMF.MODEL_OBJECT.FACTORY
{

   Reference (asArgs)
   {
      let twRPersonaIx        = Number (asArgs[0]);
      let twRPersonaIx_Friend = Number (asArgs[1]);

      return new MV.MVRP.Fabric.RFFRIEND.IREFERENCE (this.sID, twRPersonaIx, twRPersonaIx_Friend);
   }
}

MV.MVRP.Fabric.RFFRIEND.IREFERENCE = class extends MV.MVMF.MODEL_OBJECT.IREFERENCE
{

   Create (pSource)
   {
      return new MV.MVRP.Fabric.RFFRIEND (this, pSource);
   }
}

MV.MVRP.Fabric.RFMEETING = class extends MV.MVMF.MODEL_OBJECT
{
   static factory ()
   {
      return new this.FACTORY ('RFMeeting');
   }

   constructor (pReference, pSource)
   {
      super (pReference, pSource);

      this.twRFMeetingIx = pReference.twObjectIx;
   }

   Request (sAction)
   {
      let pIAction = super.Request (sAction);
      if (pIAction)
      {
         let pRequest = pIAction.pRequest;

         if ('twRFMeetingIx' in pRequest)
            pRequest.twRFMeetingIx = this.twRFMeetingIx;
      }

      return pIAction;
   }
}

MV.MVRP.Fabric.RFMEETING.FACTORY = class extends MV.MVMF.MODEL_OBJECT.FACTORY
{

   Reference (asArgs)
   {
      let twRFMeetingIx = Number (asArgs[0]);

      return new MV.MVRP.Fabric.RFMEETING.IREFERENCE (this.sID, twRFMeetingIx);
   }
}

MV.MVRP.Fabric.RFMEETING.IREFERENCE = class extends MV.MVMF.MODEL_OBJECT.IREFERENCE
{

   Create (pSource)
   {
      return new MV.MVRP.Fabric.RFMEETING (this, pSource);
   }
}

MV.MVRP.Fabric.RFTELEPORT = class extends MV.MVMF.MODEL_OBJECT
{
   static factory ()
   {
      return new this.FACTORY ('RFTeleport');
   }

   static eTYPE =
   {
      MEETUP : 0,
      SUMMON : 1
   };

   eTYPE = MV.MVRP.Fabric.RFTELEPORT.eTYPE;

   constructor (pReference, pSource)
   {
      super (pReference, pSource);

      this.twRFTeleportIx = pReference.twObjectIx;
   }

   Request (sAction)
   {
      let pIAction = super.Request (sAction);
      if (pIAction)
      {
         let pRequest = pIAction.pRequest;

         if ('twRFTeleportIx' in pRequest)
            pRequest.twRFTeleportIx = this.twRFTeleportIx;
      }

      return pIAction;
   }

   CountTarget ()
   {
      let nCount = 0;

      var cb = function (pRFTeleport_RFTarget)
      {
         if (pRFTeleport_RFTarget.bState == pRFTeleport_RFTarget.eSTATE.PENDING)
            nCount++;

         return true;
      };

      this.Child_Enum ('RFTeleport_RFTarget', this, cb);

      return nCount - 1;
   }
}

MV.MVRP.Fabric.RFTELEPORT.FACTORY = class extends MV.MVMF.MODEL_OBJECT.FACTORY
{

   Reference (asArgs)
   {
      let twRFTeleportIx = Number (asArgs[0]);

      return new MV.MVRP.Fabric.RFTELEPORT.IREFERENCE (this.sID, twRFTeleportIx);
   }
}

MV.MVRP.Fabric.RFTELEPORT.IREFERENCE = class extends MV.MVMF.MODEL_OBJECT.IREFERENCE
{

   Create (pSource)
   {
      return new MV.MVRP.Fabric.RFTELEPORT (this, pSource);
   }
}

MV.MVRP.Fabric.RFTELEPORT_RFTARGET = class extends MV.MVMF.MODEL_OBJECT
{
   static factory ()
   {
      return new this.FACTORY ('RFTeleport_RFTarget');
   }

   static eSTATE =
   {
      NULL      : 0,
      PENDING   : 1,
      DECLINED  : 2,
      ACCEPTED  : 3,
   };

   eSTATE = MV.MVRP.Fabric.RFTELEPORT_RFTARGET.eSTATE;

   constructor (pReference, pSource)
   {
      super (pReference, pSource);

      this.twRFTeleportIx  = pReference.twObjectIx;
      this.twRPersonaIx    = pReference.twChildIx;
   }

   Request (sAction)
   {
      let pIAction = super.Request (sAction);
      if (pIAction)
      {
         let pRequest = pIAction.pRequest;

         if ('twRFTeleportIx' in pRequest)
            pRequest.twRFTeleportIx = this.twRFTeleportIx;
         if ('twRPersonaIx_Target' in pRequest)
            pRequest.twRPersonaIx_Target = this.twRPersonaIx;
      }

      return pIAction;
   }
}

MV.MVRP.Fabric.RFTELEPORT_RFTARGET.FACTORY = class extends MV.MVMF.MODEL_OBJECT.FACTORY
{

   Reference (asArgs)
   {
      let twRFTeleportIx = Number (asArgs[0]);
      let twRPersonaIx   = Number (asArgs[1]);

      return new MV.MVRP.Fabric.RFTELEPORT_RFTARGET.IREFERENCE (this.sID, twRFTeleportIx, twRPersonaIx);
   }
}

MV.MVRP.Fabric.RFTELEPORT_RFTARGET.IREFERENCE = class extends MV.MVMF.MODEL_OBJECT.IREFERENCE
{

   Create (pSource)
   {
      return new MV.MVRP.Fabric.RFTELEPORT_RFTARGET (this, pSource);
   }
}

MV.MVRP.Fabric.RFGROUP = class extends MV.MVMF.MODEL_OBJECT
{
   static factory ()
   {
      return new this.FACTORY ('RFGroup');
   }

   static eFLAGS =
   {
      INVITATION_ONLY:             0x01,
      AUTO_DECLINE_OUTSIDE_RADIUS: 0x02,
      AUTO_ACCEPT_INSIDE_RADIUS:   0x04,
      AUTO_ACCEPT_INVITED_MEMBERS: 0x08,
      LEADER_SUMMON_ONLY:          0x10,
      FORCE_SUMMON_ALLOWED:        0x20
   };

   eFLAGS = MV.MVRP.Fabric.RFGROUP.eFLAGS;

   constructor (pReference, pSource)
   {
      super (pReference, pSource);

      this.twRFGroupIx = pReference.twObjectIx;
   }

   Request (sAction)
   {
      let pIAction = super.Request (sAction);
      if (pIAction)
      {
         let pRequest = pIAction.pRequest;

         if ('twRFGroupIx' in pRequest)
            pRequest.twRFGroupIx = this.twRFGroupIx;
      }

      return pIAction;
   }
}

MV.MVRP.Fabric.RFGROUP.FACTORY = class extends MV.MVMF.MODEL_OBJECT.FACTORY
{

   Reference (asArgs)
   {
      let twRFGroupIx = Number (asArgs[0]);

      return new MV.MVRP.Fabric.RFGROUP.IREFERENCE (this.sID, twRFGroupIx);
   }
}

MV.MVRP.Fabric.RFGROUP.IREFERENCE = class extends MV.MVMF.MODEL_OBJECT.IREFERENCE
{

   Create (pSource)
   {
      return new MV.MVRP.Fabric.RFGROUP (this, pSource);
   }
}

MV.MVRP.Fabric.RFGROUP_RFMEMBER = class extends MV.MVMF.MODEL_OBJECT
{
   static factory ()
   {
      return new this.FACTORY ('RFGroup_RFMember');
   }

   static eSTATE =
   {
      NULL      : 0,
      BLOCKED   : 1,
      INVITED   : 2,
      REQUESTED : 3,
      ACCEPTED  : 4,
   };

   eSTATE = MV.MVRP.Fabric.RFGROUP_RFMEMBER.eSTATE;

   constructor (pReference, pSource)
   {
      super (pReference, pSource);

      this.twRFGroupIx  = pReference.twObjectIx;
      this.twRPersonaIx = pReference.twChildIx;
   }

   Request (sAction)
   {
      let pIAction = super.Request (sAction);
      if (pIAction)
      {
         let pRequest = pIAction.pRequest;

         if ('twRFGroupIx' in pRequest)
            pRequest.twRFGroupIx = this.twRFGroupIx;
         if ('twRPersonaIx_Member' in pRequest)
            pRequest.twRPersonaIx_Member = this.twRPersonaIx;
      }

      return pIAction;
   }
}

MV.MVRP.Fabric.RFGROUP_RFMEMBER.FACTORY = class extends MV.MVMF.MODEL_OBJECT.FACTORY
{

   Reference (asArgs)
   {
      let twRFGroupIx  = Number (asArgs[0]);
      let twRPersonaIx = Number (asArgs[1]);

      return new MV.MVRP.Fabric.RFGROUP_RFMEMBER.IREFERENCE (this.sID, twRFGroupIx, twRPersonaIx);
   }
}

MV.MVRP.Fabric.RFGROUP_RFMEMBER.IREFERENCE = class extends MV.MVMF.MODEL_OBJECT.IREFERENCE
{

   Create (pSource)
   {
      return new MV.MVRP.Fabric.RFGROUP_RFMEMBER (this, pSource);
   }
}

MV.MVRP.Fabric.RFINVITATION = class extends MV.MVMF.MODEL_OBJECT
{
   static factory ()
   {
      return new this.FACTORY ('RFInvitation');
   }

   constructor (pReference, pSource)
   {
      super (pReference, pSource);

      this.twRFInvitationIx = pReference.twObjectIx;
   }

   Request (sAction)
   {
      let pIAction = super.Request (sAction);
      if (pIAction)
      {
         let pRequest = pIAction.pRequest;

         if ('twRFInvitationIx' in pRequest)
            pRequest.twRFInvitationIx = this.twRFInvitationIx;
      }

      return pIAction;
   }
}

MV.MVRP.Fabric.RFINVITATION.FACTORY = class extends MV.MVMF.MODEL_OBJECT.FACTORY
{

   Reference (asArgs)
   {
      let twRFInvitationIx = Number (asArgs[0]);

      return new MV.MVRP.Fabric.RFINVITATION.IREFERENCE (this.sID, twRFInvitationIx);
   }
}

MV.MVRP.Fabric.RFINVITATION.IREFERENCE = class extends MV.MVMF.MODEL_OBJECT.IREFERENCE
{

   Create (pSource)
   {
      return new MV.MVRP.Fabric.RFINVITATION (this, pSource);
   }
}

MV.MVRP.Fabric.RPERSONA_CACHE = class extends MV.MVMF.MODEL_OBJECT
{
   static factory ()
   {
      return new this.FACTORY ('RPersona_Cache');
   }

   #pBatch            = null;
   #nMiliseconds      = 50;
   #nCount            = 4000;
   #apCallback        = [];
   #opItem_Cache      = {};

   #fTimeout;
   #fComplete;

   constructor (pReference, pSource)
   {
      super (pReference, pSource);

      this.#fTimeout  = this.#Timeout .bind (this);
      this.#fComplete = this.#Complete.bind (this);
   }

   #Timeout ()
   {

      if (this.#pBatch.Send (this, this.#Response) == false)
      {

         this.#pBatch.Resolve ();

         this.#Complete ();
      }

      this.#pBatch = null;
   }

   #DecodeAppearance (s, nIndex)
   {
      let nResult = 0;

      if (s.length > nIndex)
      {
         if ((nResult = (s.charCodeAt (nIndex) - 65)) < 0)
            nResult = 0;
      }

      return nResult;
   }

   #Response (pIAction, pBatch)
   {
      if (pIAction.dwResult == 0)
      {

         let apRPersona = pIAction.pResponse.aResultSet[0];

         for (let i=0; i<apRPersona.length; i++)
         {
            let pRPersona = apRPersona[i];

            pRPersona.nAvatarIx      = this.#DecodeAppearance (pRPersona.cAppearance, 0);
            pRPersona.nSkinColor     = this.#DecodeAppearance (pRPersona.cAppearance, 1);
            pRPersona.nClothingColor = this.#DecodeAppearance (pRPersona.cAppearance, 2);

            let pItem     = this.#opItem_Cache[pRPersona.twRPersonaIx];

            if (pItem)
               pItem.Resolve (pRPersona);

         }
      }

      pIAction.destructor ();

      pBatch.Resolve ();

      this.#Complete ();
   }

   #Complete ()
   {

      for (let i=0; i<this.#apCallback.length; )
         if (this.#apCallback[i].Complete ())
            this.#apCallback.splice (i, 1);
         else i++;
   }

   Get (twRPersonaIx)
   {
      let pRPersona = undefined;

      if (this.#opItem_Cache[twRPersonaIx])
         pRPersona = this.#opItem_Cache[twRPersonaIx].pRPersona;

      return pRPersona;
   }

   Purge (twRPersonaIx)
   {
      if (this.#opItem_Cache[twRPersonaIx])
         delete this.#opItem_Cache[twRPersonaIx];
   }

   Fetch (atwRPersonaIx, pThis, fComplete, pParam)
   {
      let pCallback = new MV.MVRP.Fabric.RPERSONA_CACHE.CALLBACK (pThis, fComplete, pParam);

      this.#apCallback.push (pCallback);

      let bFetch = false;

      for (let i=0; i<atwRPersonaIx.length; i++)
      {
         let twRPersonaIx = atwRPersonaIx[i];

         if (Number.isInteger (twRPersonaIx)  &&  twRPersonaIx > 0)
         {
            let pItem = this.#opItem_Cache[twRPersonaIx];

            if (!pItem)
            {

               this.#opItem_Cache[twRPersonaIx] = new MV.MVRP.Fabric.RPERSONA_CACHE.ITEM (twRPersonaIx);

               pItem = this.#opItem_Cache[twRPersonaIx];

               if (this.#pBatch == null)
                  this.#pBatch = new MV.MVRP.Fabric.RPERSONA_CACHE.BATCH (this, this.#fTimeout, this.#nMiliseconds);

               this.#pBatch.Item (twRPersonaIx, pItem);

               bFetch = true;
            }

            pCallback.Item (twRPersonaIx, pItem);
         }
      }

      if (bFetch == false)
      {

         setTimeout (this.#fComplete, 0);
      }
   }

   FetchEx (atwRPersonaIx, pThis, fn, pParam)
   {
      let atwRPersonaIx_Fetch = [];
      let aRPersona = {};

      for (let i=0; i < atwRPersonaIx.length; i++)
      {
         let RPersona = this.Get (atwRPersonaIx[i]);

         if (RPersona == null || RPersona === undefined)
            atwRPersonaIx_Fetch.push (atwRPersonaIx[i]);
         else aRPersona[atwRPersonaIx[i]] = RPersona;
      }

      if (Object.keys (aRPersona).length > 0)
         fn.call (pThis, aRPersona, pParam);

      if (atwRPersonaIx_Fetch.length > 0)
         this.Fetch (atwRPersonaIx_Fetch, pThis, fn, pParam);

      return aRPersona;
   }

   ParseName (sName, MVO_RPersona_Name)
   {
      const isInteger = num => /^-?[0-9]+$/.test(num+'');
      let asName = sName.split ('.');

      MVO_RPersona_Name.wsForename = '';
      MVO_RPersona_Name.wsSurname  = '';
      MVO_RPersona_Name.dwSequence  = 0;

      if (asName.length > 0)
      {
         MVO_RPersona_Name.wsForename = asName[0];

         if (asName.length == 2)
         {
            if (isInteger (asName[1]))
               MVO_RPersona_Name.dwSequence = Number (asName[1]);
            else MVO_RPersona_Name.wsSurname = asName[1];
         }
         else if (asName.length == 3)
         {
            MVO_RPersona_Name.wsSurname  = asName[1];
            MVO_RPersona_Name.dwSequence  = Number (asName[2]);
         }
      }
   }

   FullName (pRPersona)
   {
      let sResult = pRPersona.Name_wsForename;

      if (pRPersona.Name_wsSurname != '')
         sResult += '.' + pRPersona.Name_wsSurname;
      if (pRPersona.Name_dwSequence != 0)
         sResult += '.' + pRPersona.Name_dwSequence;

      return sResult;
   }

   onUpdateInfo (pIAction, Param)
   {
      let pRSP = pIAction.pResponse;

      if (pRSP.nResult == 0)
      {
         let pRPersona = pRSP.aResultSet[0][0];

         pRPersona.nAvatarIx      = this.#DecodeAppearance (pRPersona.cAppearance, 0);
         pRPersona.nSkinColor     = this.#DecodeAppearance (pRPersona.cAppearance, 1);
         pRPersona.nClothingColor = this.#DecodeAppearance (pRPersona.cAppearance, 2);

         this.#opItem_Cache[pRPersona.twRPersonaIx].pRPersona = pRPersona;
      }

      Param.fn.call (Param.pThis, pIAction, Param.Param);
   }

   UpdateInfo (sAction, pData, pThis, fn, Param)
   {
      let ParamEx = {
         pThis:   pThis,
         fn:      fn,
         Param:   Param
      }

      this.Send (sAction, pData, this, this.onUpdateInfo, ParamEx);
   }
}

MV.MVRP.Fabric.RPERSONA_CACHE.ITEM = class
{

   constructor (twRPersonaIx)
   {
      this.twRPersonaIx = twRPersonaIx;

      this.pRPersona    = undefined;
   }

   Resolve (pRPersona)
   {
      this.pRPersona    = pRPersona;
   }
}

MV.MVRP.Fabric.RPERSONA_CACHE.CALLBACK = class
{
   constructor (pThis, fComplete, pParam)
   {
      this.pThis     = pThis;
      this.fComplete = fComplete;
      this.pParam    = pParam;

      this.opItem    = {};
   }

   Item (twRPersonaIx, pItem)
   {
      this.opItem[twRPersonaIx] = pItem;
   }

   Complete ()
   {

      let bComplete  = true;
      let opRPersona = {};

      for (let twRPersonaIx in this.opItem)
         if ((opRPersona[twRPersonaIx] = this.opItem[twRPersonaIx].pRPersona) === undefined)
         {
            bComplete = false;
            break;
         }

      if (bComplete)
         this.fComplete.call (this.pThis, opRPersona, this.pParam);

      return bComplete;
   }
}

MV.MVRP.Fabric.RPERSONA_CACHE.BATCH = class
{
   constructor (pCache, fTimeout, nMiliseconds)
   {
      this.pCache        = pCache;
      this.fTimeout      = fTimeout;
      this.nMiliseconds  = nMiliseconds;
      this.nTimeout      = setTimeout (this.fTimeout, this.nMiliseconds);

      this.opItem        = {};

      this.otwRPersonaIx = {};
   }

   Item (twRPersonaIx, pItem)
   {
      this.opItem[twRPersonaIx] = pItem;

      this.otwRPersonaIx[twRPersonaIx] = twRPersonaIx;

   }

   Send (pThis, fComplete)
   {
      let bResult = false;
      let pIAction = this.pCache.Request ('FETCH');

      if (pIAction)
      {
         let sRPersonaIx_List = '';

         for (let twRPersonaIx in this.otwRPersonaIx)
         {
            if (sRPersonaIx_List.length > 0)
               sRPersonaIx_List += ',';
            sRPersonaIx_List += twRPersonaIx;
         }

         pIAction.pRequest.sRPersonaIx_List = sRPersonaIx_List;

         pIAction.Send (pThis, fComplete, this);

         bResult = true;
      }

      return bResult;
   }

   Resolve ()
   {

      for (let twRPersonaIx in this.otwRPersonaIx)
         if (this.opItem[twRPersonaIx].pRPersona === undefined)
         {
            this.opItem[twRPersonaIx].Resolve (null);
            this.pCache.Purge (twRPersonaIx);
         }
   }
}

MV.MVRP.Fabric.RPERSONA_CACHE.FACTORY = class extends MV.MVMF.MODEL_OBJECT.FACTORY
{

   Reference (asArgs)
   {
      let twRPersonaIx = 1;

      return new MV.MVRP.Fabric.RPERSONA_CACHE.IREFERENCE (this.sID, twRPersonaIx);
   }
}

MV.MVRP.Fabric.RPERSONA_CACHE.IREFERENCE = class extends MV.MVMF.MODEL_OBJECT.IREFERENCE
{

   Create (pSource)
   {
      return new MV.MVRP.Fabric.RPERSONA_CACHE (this, pSource);
   }
}

MV.MVRP.Fabric.RGLOBALREGISTRY = class extends MV.MVMF.MODEL_OBJECT
{
   static factory ()
   {
      return new this.FACTORY ('RGlobalRegistry');
   }

   constructor (pReference, pSource)
   {
      super (pReference, pSource);

      this.Registry = null;
   }

   #onResponse (pIAction, pParam)
   {
      this.Registry = {};

      if (pIAction.dwResult == 0)
      {
         if (pIAction.pResponse.aResultSet.length > 0)
         {
            let Results = pIAction.pResponse.aResultSet[0];
            for (let i=0; i < Results.length; i++)
            {
               this.Registry[Results[i].wsKey] = Results[i].wsValue;
            }
         }

         this.ReadyState (this.eSTATE.RECOVERED);
      }
   }

   #onResponse2 (pIAction, pParam)
   {
      if (pIAction.dwResult == 0)
      {
         this.Registry[pIAction.pRequest.wsKey] = pIAction.pRequest.wsValue;
      }
      else console.log ('ERROR: Registry ' + pIAction.dwResult);
   }

   Load ()
   {
      this.ReadyState (this.eSTATE.EMPTY);

      let pIAction = this.Request ('GET');

      pIAction.Send (this, this.#onResponse);
   }

   Get (wsKey)
   {
      return this.Registry ? this.Registry[wsKey] : null;
   }

   Set (wsKey, wsValue)
   {
      if (this.Registry)
      {
         let pIAction = this.Request ('SET');
         let Payload = pIAction.pRequest;

         Payload.wsKey   = wsKey;
         Payload.wsValue = wsValue;

         pIAction.Send (this, this.#onResponse2);
      }
   }
}

MV.MVRP.Fabric.RGLOBALREGISTRY.FACTORY = class extends MV.MVMF.MODEL_OBJECT.FACTORY
{

   Reference (asArgs)
   {
      let twRPersonaIx = Number (asArgs[0]);

      return new MV.MVRP.Fabric.RGLOBALREGISTRY.IREFERENCE (this.sID, twRPersonaIx);
   }
}

MV.MVRP.Fabric.RGLOBALREGISTRY.IREFERENCE = class extends MV.MVMF.MODEL_OBJECT.IREFERENCE
{

   Create (pSource)
   {
      return new MV.MVRP.Fabric.RGLOBALREGISTRY (this, pSource);
   }
}

MV.MVRP.Fabric.RNROOT = class extends MV.MVMF.MODEL_OBJECT
{
   static factory ()
   {
      return new this.FACTORY ('RNRoot');
   }

   constructor (pReference, pSource)
   {
      super (pReference, pSource);

      this.twRPersonaIx = pReference.twObjectIx
   }
}

MV.MVRP.Fabric.RNROOT.FACTORY = class extends MV.MVMF.MODEL_OBJECT.FACTORY
{

   Reference (asArgs)
   {
      let twRPersonaIx = Number (asArgs[0]);

      return new MV.MVRP.Fabric.RNROOT.IREFERENCE (this.sID, twRPersonaIx);
   }
}

MV.MVRP.Fabric.RNROOT.IREFERENCE = class extends MV.MVMF.MODEL_OBJECT.IREFERENCE
{

   Create (pSource)
   {
      return new MV.MVRP.Fabric.RNROOT (this, pSource);
   }
}

MV.MVRP.Fabric.RNNOTIFICATION = class extends MV.MVMF.MODEL_OBJECT
{
   static factory ()
   {
      return new this.FACTORY ('RNNotification');
   }

   constructor (pReference, pSource)
   {
      super (pReference, pSource);

      this.twRNNotificationIx = pReference.twObjectIx;
   }

   Request (sAction)
   {
      let pIAction = super.Request (sAction);
      if (pIAction)
      {
         let pRequest = pIAction.pRequest;

         if ('twRNNotificationIx' in pRequest)
            pRequest.twRNNotificationIx = this.twRNNotificationIx;
      }

      return pIAction;
   }
}

MV.MVRP.Fabric.RNNOTIFICATION.FACTORY = class extends MV.MVMF.MODEL_OBJECT.FACTORY
{

   Reference (asArgs)
   {
      let twRNNotificationIx = Number (asArgs[0]);

      return new MV.MVRP.Fabric.RNNOTIFICATION.IREFERENCE (this.sID, twRNNotificationIx);
   }
}

MV.MVRP.Fabric.RNNOTIFICATION.IREFERENCE = class extends MV.MVMF.MODEL_OBJECT.IREFERENCE
{

   Create (pSource)
   {
      return new MV.MVRP.Fabric.RNNOTIFICATION (this, pSource);
   }
}

MV.MVRP.Fabric.RNROOT_RNNOTIFICATION = class extends MV.MVMF.MODEL_OBJECT
{
   static factory ()
   {
      return new this.FACTORY ('RNRoot_RNNotification');
   }

   constructor (pReference, pSource)
   {
      super (pReference, pSource);

      this.twRPersonaIx       = pReference.twObjectIx;
      this.twRNNotificationIx = pReference.twChildIx;
   }
}

MV.MVRP.Fabric.RNROOT_RNNOTIFICATION.FACTORY = class extends MV.MVMF.MODEL_OBJECT.FACTORY
{

   Reference (asArgs)
   {
      let twRPersonaIx        = Number (asArgs[0]);
      let twRNNotificationIx  = Number (asArgs[1]);

      return new MV.MVRP.Fabric.RNROOT_RNNOTIFICATION.IREFERENCE (this.sID, twRPersonaIx, twRNNotificationIx);
   }
}

MV.MVRP.Fabric.RNROOT_RNNOTIFICATION.IREFERENCE = class extends MV.MVMF.MODEL_OBJECT.IREFERENCE
{

   Create (pSource)
   {
      return new MV.MVRP.Fabric.RNROOT_RNNOTIFICATION (this, pSource);
   }
}

MV.MVRP.Fabric.FRIENDS = class extends MV.MVMF.NOTIFICATION
{
   static eSTATE =
   {
      NOTREADY      : 0,
      CONNECTING    : 1,
      READY         : 2,
   }
   eSTATE = MV.MVRP.Fabric.FRIENDS.eSTATE;

   #m_pLnG;
   #m_pRFRoot;
   #m_apRFChat;
   #m_apRFGroup;
   #m_apRFTeleport;
   #m_apRFMeeting;
   #m_apRFInvitation;

   #m_twRPersonaIx;

   constructor (pLnG, twRPersonaIx)
   {
      super ();

      this.#m_twRPersonaIx    = twRPersonaIx;

      this.#m_pRFRoot         = null;
      this.#m_apRFChat        = {};
      this.#m_apRFGroup       = {};
      this.#m_apRFTeleport    = {};
      this.#m_apRFMeeting     = {};
      this.#m_apRFInvitation  = {};

      this.#m_pLnG            = pLnG;
      this.#m_pLnG.Attach (this);
   }

   destructor ()
   {
      this.#Unload ();

      this.#m_pLnG = null;

      return null;
   }

   get pRFRoot ()
   {
      return this.#m_pRFRoot;
   }

   get pLnG ()
   {
      return this.#m_pLnG;
   }

   onInserted (pNotice)
   {
      if (pNotice.pData.pChild != null)
      {
         switch (pNotice.pData.pChild.sID)
         {
            case 'RFRoot_RFGroup':
               let pRFRoot_RFGroup = pNotice.pData.pChild;

               if (pRFRoot_RFGroup.bState == MV.MVRP.Fabric.RFGROUP_RFMEMBER.eSTATE.ACCEPTED)
               {
                  this.#m_apRFGroup[pNotice.pData.pChild.twRFGroupIx] = this.#m_pLnG.Model_Open ('RFGroup', '' + pNotice.pData.pChild.twRFGroupIx);
                  this.#m_apRFGroup[pNotice.pData.pChild.twRFGroupIx].Attach (this);
               }
               else
               {
                  this.Emit ('onRootGroupAdd', pRFRoot_RFGroup);
               }
               break;

            case 'RFMeeting':
               this.Emit ('onMeetingAdd', pNotice.pData.pChild);
               break;

            case 'RFInvitation':
               this.Emit ('onInvitationAdd', pNotice.pData.pChild);
               break;

            case 'RFRoot_RFChat':
               this.Emit ('onRootChatAdd', pNotice.pData.pChild);

               this.#m_apRFChat[pNotice.pData.pChild.twRFChatIx] = this.#m_pLnG.Model_Open ('RFChat', '' + pNotice.pData.pChild.twRFChatIx);
               this.#m_apRFChat[pNotice.pData.pChild.twRFChatIx].Attach (this);
               break;

            case 'RFRoot_RFTeleport':
               let pRFRoot_RFTeleport = pNotice.pData.pChild;

               this.Emit ('onRootTeleportAdd', pRFRoot_RFTeleport);

               this.#m_apRFTeleport[pRFRoot_RFTeleport.twRFTeleportIx] = this.#m_pLnG.Model_Open ('RFTeleport', '' + pRFRoot_RFTeleport.twRFTeleportIx);
               this.#m_apRFTeleport[pRFRoot_RFTeleport.twRFTeleportIx].Attach (this);
               break;

            case 'RFFriend':
               this.Emit ('onFriendAdd', pNotice.pData.pChild);
               break;

            case 'RFGroup':
               this.Emit ('onGroupAdd', pNotice.pData.pChild);
               break;

            case 'RFGroup_RFMember':
               this.Emit ('onGroupMemberAdd', { pRFGroup_RFMember: pNotice.pData.pChild, pRFGroup: pNotice.pCreator });
               break;

            case 'RFChat':
               this.Emit ('onChatAdd', pNotice.pData.pChild);
               break;

            case 'RFChat_RFMember':
               this.Emit ('onChatMemberAdd', { pRFChat_RFMember: pNotice.pData.pChild, pRFChat: pNotice.pCreator });
               break;

            case 'RFChat_RFMessage':
               this.Emit ('onChatMessageAdd', { pRFChat_RFMessage: pNotice.pData.pChild, pRFChat: pNotice.pCreator });
               break;

            case 'RFTeleport':
               this.Emit ('onTeleportAdd', pNotice.pData.pChild);
               break;

            case 'RFTeleport_RFTarget':
               this.Emit ('onTeleportTargetAdd', { pRFTeleport_RFTarget: pNotice.pData.pChild, pRFTeleport: pNotice.pCreator });
               break;
         }
      }
   }

   onUpdated (pNotice)
   {
      if (pNotice.pData.pChild != null)
      {
         switch (pNotice.pData.pChild.sID)
         {
            case 'RFRoot_RFGroup':
               let pRFRoot_RFGroup = pNotice.pData.pChild;

               this.Emit ('onRootGroupUpdate', pRFRoot_RFGroup);

               if (pRFRoot_RFGroup.bState == MV.MVRP.Fabric.RFGROUP_RFMEMBER.eSTATE.ACCEPTED && !(this.#m_apRFGroup[pRFRoot_RFGroup.twRFGroupIx]))
               {
                  this.#m_apRFGroup[pRFRoot_RFGroup.twRFGroupIx] = this.#m_pLnG.Model_Open ('RFGroup', '' + pRFRoot_RFGroup.twRFGroupIx);
                  this.#m_apRFGroup[pRFRoot_RFGroup.twRFGroupIx].Attach (this);
               }
               break;

            case 'RFMeeting':
               this.Emit ('onMeetingUpdate', pNotice.pData.pChild);
               break;

            case 'RFRoot_RFChat':

               break;

            case 'RFRoot_RFTeleport':
               let pRFRoot_RFTeleport = pNotice.pData.pChild;

               this.Emit ('onRootTeleportUpdate', pRFRoot_RFTeleport);
               break;

            case 'RFFriend':
               this.Emit ('onFriendUpdate', pNotice.pData.pChild);
               break;

            case 'RFGroup':
               this.Emit ('onGroupUpdate', pNotice.pData.pChild);
               break;

            case 'RFGroup_RFMember':
               this.Emit ('onGroupMemberUpdate', { pRFGroup_RFMember: pNotice.pData.pChild, pRFGroup: pNotice.pCreator });
               break;

            case 'RFChat':
               this.Emit ('onChatUpdate', pNotice.pData.pChild);
               break;

            case 'RFChat_RFMember':
               this.Emit ('onChatMemberUpdate', { pRFChat_RFMember: pNotice.pData.pChild, pRFChat: pNotice.pCreator });
               break;

            case 'RFChat_RFMessage':

               break;

            case 'RFTeleport':
               this.Emit ('onTeleportUpdate', pNotice.pData.pChild);
               break;

            case 'RFTeleport_RFTarget':
               this.Emit ('onTeleportTargetUpdate', { pRFTeleport_RFTarget: pNotice.pData.pChild, pRFTeleport: pNotice.pCreator });

               break;
         }
      }
      else if (pNotice.pData.pChange != null && pNotice.pData.pChange.sType == 'MUTE')
      {
         this.Emit ('onGroupMute', pNotice.pData.pChange);
      }
      else if (pNotice.pCreator == this.#m_pRFRoot)
      {
         this.Emit ('onRFRootUpdate', pNotice.pCreator);
      }
   }

   onChanged (pNotice)
   {
      this.onUpdated (pNotice);
   }

   onDeleting (pNotice)
   {
      if (pNotice.pData.pChild != null)
      {
         switch (pNotice.pData.pChild.sID)
         {
            case 'RFRoot_RFGroup':
               this.Emit ('onRootGroupRemove', pNotice.pData.pChild);

               if (this.#m_apRFGroup[pNotice.pData.pChild.twRFGroupIx])
               {
                  this.#m_apRFGroup[pNotice.pData.pChild.twRFGroupIx].Detach (this);
                  this.#m_apRFGroup[pNotice.pData.pChild.twRFGroupIx] = this.#m_pLnG.Model_Close (this.#m_apRFGroup[pNotice.pData.pChild.twRFGroupIx]);
               }
               break;

            case 'RFMeeting':
               this.Emit ('onMeetingRemove', pNotice.pData.pChild);

               if (this.#m_apRFMeeting[pNotice.pData.pChild.twRFMeetingIx])
               {
                  this.#m_apRFMeeting[pNotice.pData.pChild.twRFMeetingIx].Detach (this);
                  this.#m_apRFMeeting[pNotice.pData.pChild.twRFMeetingIx] = this.#m_pLnG.Model_Close (this.#m_apRFMeeting[pNotice.pData.pChild.twRFMeetingIx]);
               }
               break;

            case 'RFInvitation':
               this.Emit ('onInvitationRemove', pNotice.pData.pChild);

               if (this.#m_apRFInvitation[pNotice.pData.pChild.twRFInvitationIx])
               {
                  this.#m_apRFInvitation[pNotice.pData.pChild.twRFInvitationIx].Detach (this);
                  this.#m_apRFInvitation[pNotice.pData.pChild.twRFInvitationIx] = this.#m_pLnG.Model_Close (this.#m_apRFInvitation[pNotice.pData.pChild.twRFInvitationIx]);
               }
               break;

            case 'RFRoot_RFChat':
               this.Emit ('onRootChatRemove', pNotice.pData.pChild);

               this.#m_apRFChat[pNotice.pData.pChild.twRFChatIx].Detach (this);
               this.#m_apRFChat[pNotice.pData.pChild.twRFChatIx] = this.#m_pLnG.Model_Close (this.#m_apRFChat[pNotice.pData.pChild.twRFChatIx]);
               break;

            case 'RFRoot_RFTeleport':
               this.Emit ('onRootTeleportRemove', pNotice.pData.pChild);

               if (this.#m_apRFTeleport[pNotice.pData.pChild.twRFTeleportIx])
               {
                  this.#m_apRFTeleport[pNotice.pData.pChild.twRFTeleportIx].Detach (this);
                  this.#m_apRFTeleport[pNotice.pData.pChild.twRFTeleportIx] = this.#m_pLnG.Model_Close (this.#m_apRFTeleport[pNotice.pData.pChild.twRFTeleportIx]);
               }
               break;

            case 'RFFriend':
               this.Emit ('onFriendRemove', pNotice.pData.pChild);
               break;

            case 'RFGroup':
               this.Emit ('onGroupRemove', pNotice.pData.pChild);
               break;

            case 'RFGroup_RFMember':
               this.Emit ('onGroupMemberRemove', { pRFGroup_RFMember: pNotice.pData.pChild, pRFGroup: pNotice.pCreator });
               break;

            case 'RFChat':
               this.Emit ('onChatRemove', pNotice.pData.pChild);
               break;

            case 'RFChat_RFMember':
               this.Emit ('onChatMemberRemove', { pRFChat_RFMember: pNotice.pData.pChild, pRFChat: pNotice.pCreator });
               break;

            case 'RFChat_RFMessage':

               break;

            case 'RFTeleport':

               break;

            case 'RFTeleport_RFTarget':

               break;
         }
      }
   }

   onReadyState (pNotice)
   {
      if (pNotice.pCreator == this.#m_pLnG)
      {
         if (this.#m_pLnG.ReadyState () == this.#m_pLnG.eSTATE.DISCONNECTED)
         {
            this.Emit ('onRP1Friend_NotReady');
         }
         else if (this.#m_pLnG.ReadyState () == this.#m_pLnG.eSTATE.LOGGEDIN)
         {
            if (this.#m_pRFRoot == null)
            {
               this.#m_pRFRoot = this.#m_pLnG.Model_Open ('RFRoot', '' + this.#m_twRPersonaIx);
               this.#m_pRFRoot.Attach (this);
            }
            else
            {
               this.ReadyState (this.eSTATE.READY);
               this.Online ();
               this.Emit ('onRP1Friend_Ready', this.#m_pRFRoot);
            }
         }
      }
      else if (pNotice.pCreator == this.#m_pRFRoot)
      {
         if (this.#m_pRFRoot.ReadyState () == this.#m_pRFRoot.eSTATE.RECOVERED)
         {
            this.ReadyState (this.eSTATE.READY);
            this.Online ();

            this.Emit ('onRP1Friend_Ready', this.#m_pRFRoot);
         }
      }
      else if (pNotice.pCreator.sID == 'RFTeleport')
      {
         if (pNotice.pCreator.ReadyState () == pNotice.pCreator.eSTATE.RECOVERED)
         {

         }
      }
   }

   Online ()
   {
      if (this.ReadyState () == this.eSTATE.READY)
      {
         var Response = function (pIAction, Param)
         {
            let pResponse = pIAction.pResponse;

            if (pResponse.nResult == 0)
            {
            }
            else alert ('ERROR: ' + pResponse.nResult);
         }

         let pIAction = this.#m_pRFRoot.Request ('ONLINE');

         pIAction.Send (this, Response);
      }
   }

   IsSelf (twRPersonaIx)
   {
      return (this.#m_twRPersonaIx == twRPersonaIx);
   }

   Get_Meeting_Encode (twRFMeetingIx, pThis, fn, Param)
   {
      let pIAction = this.#m_pRFRoot.Request ('RFMEETING_ENCODE');
      let pRequest = pIAction.pRequest;

      pRequest.twRFMeetingIx = twRFMeetingIx;

      pIAction.Send (pThis, fn, Param);
   }

   Decode_Meeting_Id (sRFMeetingId, pThis, fn, Param)
   {
      let pIAction = this.#m_pRFRoot.Request ('RFMEETING_DECODE');
      let pRequest = pIAction.pRequest;

      pRequest.sRFMeetingId = sRFMeetingId;

      pIAction.Send (pThis, fn, Param);
   }

   Create_Meeting (wsName, tStart, txDuration, nSize, nScene, sPassword, pThis, fn, Param)
   {
      let pIAction = this.#m_pRFRoot.Request ('RFMEETING_CREATE');
      let pRequest = pIAction.pRequest;

      pRequest.wsName     = wsName;
      pRequest.tStart     = tStart;
      pRequest.txDuration = txDuration;
      pRequest.nSize      = nSize;
      pRequest.nScene     = nScene;
      pRequest.sPassword  = sPassword;

      pIAction.Send (pThis, fn, Param);
   }

   Destroy_Meeting (twRFMeetingIx, pThis, fn, Param)
   {
      let pIAction = this.#m_pRFRoot.Request ('RFMEETING_DESTROY');
      let pRequest = pIAction.pRequest;

      pRequest.twRFMeetingIx = twRFMeetingIx;

      pIAction.Send (pThis, fn, Param);
   }

   Create_Invitation (nDuration, bFriendRequestAllowed, bMeetupAllowed, bAutoAcceptMeetup, bSummonAllowed, pThis, fn, Param)
   {
      let pIAction = this.#m_pRFRoot.Request ('RFINVITATION_CREATE');
      let pRequest = pIAction.pRequest;

      pRequest.nDuration               = nDuration;
      pRequest.bFriendRequestAllowed   = bFriendRequestAllowed;
      pRequest.bMeetupAllowed          = bMeetupAllowed;
      pRequest.bAutoAcceptMeetup       = bAutoAcceptMeetup;
      pRequest.bSummonAllowed          = bSummonAllowed;

      pIAction.Send (pThis, fn, Param);
   }

   Friend_Request_Invitation (sRFInvitationId, pThis, fn, Param)
   {
      let pIAction = this.#m_pRFRoot.Request ('RFFRIEND_REQUEST_INVITATION');
      let pRequest = pIAction.pRequest;

      pRequest.sRFInvitationId = sRFInvitationId;

      pIAction.Send (pThis, fn, Param);
   }

   Meetup_Invitation (sRFInvitationId, pThis, fn, Param)
   {
      let pIAction = this.#m_pRFRoot.Request ('RFFRIEND_MEETUP_INVITATION');
      let pRequest = pIAction.pRequest;

      pRequest.sRFInvitationId = sRFInvitationId;

      pIAction.Send (pThis, fn, Param);
   }

   Summon_Invitation (sRFInvitationId, pThis, fn, Param)
   {
      let pIAction = this.#m_pRFRoot.Request ('RFFRIEND_SUMMON_INVITATION');
      let pRequest = pIAction.pRequest;

      pRequest.sRFInvitationId = sRFInvitationId;

      pIAction.Send (pThis, fn, Param);
   }

   Delete_Invitation (twRFInvitationIx, pThis, fn, Param)
   {
      let pIAction = this.#m_pRFRoot.Request ('RFINVITATION_DELETE');
      let pRequest = pIAction.pRequest;

      pRequest.twRFInvitationIx = twRFInvitationIx;

      pIAction.Send (pThis, fn, Param);
   }

   Encode_Invitation (twRFInvitationIx, pThis, fn, Param)
   {
      let pIAction = this.#m_pRFRoot.Request ('RFINVITATION_ENCODE');
      let pRequest = pIAction.pRequest;

      pRequest.twRFInvitationIx = twRFInvitationIx;

      pIAction.Send (pThis, fn, Param);
   }

   Decode_Invitation (sRFInvitationId, pThis, fn, Param)
   {
      let pIAction = this.#m_pRFRoot.Request ('RFINVITATION_DECODE');
      let pRequest = pIAction.pRequest;

      pRequest.sRFInvitationId = sRFInvitationId;

      pIAction.Send (pThis, fn, Param);
   }

   Leave_Group (twRFGroupIx, pThis, fn, Param)
   {
      let pIAction = this.#m_pRFRoot.Request ('RFGROUP_REMOVE');
      let pRequest = pIAction.pRequest;

      pRequest.twRFGroupIx = twRFGroupIx;

      pIAction.Send (pThis, fn, Param);
   }

   Group_Mute (twRFGroupIx, twRPersonaIx, pThis, fn, Param)
   {
      let pIAction = this.#m_pLnG.pClient.Request (MV.MVRP.Fabric.IO_RFGROUP.apAction.MUTE);
      let pRequest = pIAction.pRequest;

      pRequest.twRFGroupIx          = twRFGroupIx;
      pRequest.twRPersonaIx_Member  = twRPersonaIx;

      pIAction.Send (pThis, fn, Param);
   }

   Edit_Meeting (twRFMeetingIx, wsName, tStart, txDuration, nSize, nScene, sPassword, pThis, fn, Param)
   {
      let pIAction = this.#m_pRFRoot.Request ('RFMEETING_MODIFY');
      let pRequest = pIAction.pRequest;

      pRequest.twRFMeetingIx = twRFMeetingIx;
      pRequest.wsName = wsName;
      pRequest.tStart = tStart;
      pRequest.txDuration = txDuration;
      pRequest.nSize = nSize;
      pRequest.nScene = nScene;
      pRequest.sPassword = sPassword;

      pIAction.Send (pThis, fn, Param);
   }

   Edit_Meeting_Running (twRFMeetingIx, wsName, sPassword, pThis, fn, Param)
   {
      let pIAction = this.#m_pRFRoot.Request ('RFMEETING_MODIFY_RUNNING');
      let pRequest = pIAction.pRequest;

      pRequest.twRFMeetingIx = twRFMeetingIx;
      pRequest.wsName = wsName;
      pRequest.sPassword = sPassword;

      pIAction.Send (pThis, fn, Param);
   }

   Start_Meeting (twRFMeetingIx, pThis, fn, Param)
   {
      let pIAction = this.#m_pRFRoot.Request ('RFMEETING_START');
      let pRequest = pIAction.pRequest;

      pRequest.twRFMeetingIx = twRFMeetingIx;

      pIAction.Send (pThis, fn, Param);
   }

   End_Meeting (twRFMeetingIx, pThis, fn, Param)
   {
      let pIAction = this.#m_pRFRoot.Request ('RFMEETING_END');
      let pRequest = pIAction.pRequest;

      pRequest.twRFMeetingIx = twRFMeetingIx;

      pIAction.Send (pThis, fn, Param);
   }

   Extend_Meeting (twRFMeetingIx, nDuration, pThis, fn, Param)
   {
      let pIAction = this.#m_pRFRoot.Request ('RFMEETING_EXTEND');
      let pRequest = pIAction.pRequest;

      pRequest.twRFMeetingIx = twRFMeetingIx;
      pRequest.nDuration = nDuration;

      pIAction.Send (pThis, fn, Param);
   }

   Join_Meeting (sRFMeetingId, sPassword, pThis, fn, Param)
   {
      let pIAction = this.#m_pRFRoot.Request ('RFMEETING_JOIN');
      let pRequest = pIAction.pRequest;

      pRequest.sRFMeetingId = sRFMeetingId;
      pRequest.sPassword    = sPassword;

      pIAction.Send (pThis, fn, Param);
   }

   Chat_Invite (twRFChatIx, sRPersonaIx_List, pThis, fn, Param)
   {
      let pIAction = this.#m_pLnG.pClient.Request (MV.MVRP.Fabric.IO_RFCHAT.apAction.ADD);
      let pRequest = pIAction.pRequest;

      pRequest.twRFChatIx        = twRFChatIx;
      pRequest.sRPersonaIx_List = sRPersonaIx_List;

      pIAction.Send (pThis, fn, Param);
   }

   Chat_Leave (twRFChatIx, pThis, fn, Param)
   {
      let pIAction = this.#m_pLnG.pClient.Request (MV.MVRP.Fabric.IO_RFCHAT.apAction.REMOVE);
      let pRequest = pIAction.pRequest;

      pRequest.twRFChatIx        = twRFChatIx;

      pIAction.Send (pThis, fn, Param);
   }

   #Unload (bNotify)
   {
      this.#m_pLnG.Detach (this);
      this.ReadyState (this.eSTATE.NOTREADY);

      this.#m_twRPersonaIx = 0;

      if (this.#m_pRFRoot)
      {
         this.#m_pRFRoot.Detach (this);
         this.#m_pRFRoot = this.#m_pLnG.Model_Close (this.#m_pRFRoot);
      }

      for (let twRFChatIx in this.#m_apRFChat)
      {
         if (this.#m_apRFChat[twRFChatIx])
         {
            this.#m_apRFChat[twRFChatIx].Detach (this);

            this.#m_pLnG.Model_Close (this.#m_apRFChat[twRFChatIx]);
         }
      }

      for (let twRFGroupIx in this.#m_apRFGroup)
      {
         if (this.#m_apRFGroup[twRFGroupIx])
         {
            this.#m_apRFGroup[twRFGroupIx].Detach (this);

            this.#m_pLnG.Model_Close (this.#m_apRFGroup[twRFGroupIx]);
         }
      }

      for (let twRFTeleportIx in this.#m_apRFTeleport)
      {
         if (this.#m_apRFTeleport[twRFTeleportIx])
         {
            this.#m_apRFTeleport[twRFTeleportIx].Detach (this);

            this.#m_pLnG.Model_Close (this.#m_apRFTeleport[twRFTeleportIx]);
         }
      }

      for (let twRFMeetingIx in this.#m_apRFMeeting)
      {
         if (this.#m_apRFMeeting[twRFMeetingIx])
         {
            this.#m_apRFMeeting[twRFMeetingIx].Detach (this);

            this.#m_pLnG.Model_Close (this.#m_apRFMeeting[twRFMeetingIx]);
         }
      }

      for (let twRFInvitationIx in this.#m_apRFInvitation)
      {
         if (this.#m_apRFInvitation[twRFInvitationIx])
         {
            this.#m_apRFInvitation[twRFInvitationIx].Detach (this);

            this.#m_pLnG.Model_Close (this.#m_apRFInvitation[twRFInvitationIx]);
         }
      }
   }
}

MV.MVRP.Fabric.Notification = class extends MV.MVMF.NOTIFICATION
{
   static eSTATE =
   {
      NOTREADY      : 0,
      CONNECTING    : 1,
      READY         : 2,
   }
   eSTATE = MV.MVRP.Fabric.Notification.eSTATE;

   #m_pLnG;
   #m_pRNRoot;

   #m_twRPersonaIx;

   constructor (pLnG, twRPersonaIx)
   {
      super ();

      this.#m_twRPersonaIx    = twRPersonaIx;

      this.#m_pRNRoot         = null;

      this.#m_pLnG            = pLnG;
      this.#m_pLnG.Attach (this);
   }

   destructor ()
   {
      this.#Unload ();

      this.#m_pLnG = null;

      return null;
   }

   get pRNRoot ()
   {
      return this.#m_pRNRoot;
   }

   get pLnG ()
   {
      return this.#m_pLnG;
   }

   onReadyState (pNotice)
   {
      if (pNotice.pCreator == this.#m_pLnG)
      {
         if (this.#m_pLnG.ReadyState () == this.#m_pLnG.eSTATE.DISCONNECTED)
         {
            this.Emit ('onRP1Notification_NotReady');
         }
         else if (this.#m_pLnG.ReadyState () == this.#m_pLnG.eSTATE.LOGGEDIN)
         {
            if (this.#m_pRNRoot == null)
            {
               this.#m_pRNRoot = this.#m_pLnG.Model_Open ('RNRoot', '' + this.#m_twRPersonaIx);
               this.#m_pRNRoot.Attach (this);
            }
            else if (this.#m_pRNRoot.ReadyState () == this.#m_pRNRoot.eSTATE.RECOVERED)
            {
               this.ReadyState (this.eSTATE.READY);
               this.Emit ('onRP1Notification_Ready', this.#m_pRNRoot);
            }
         }
      }
      else if (pNotice.pCreator == this.#m_pRNRoot)
      {
         if (this.#m_pRNRoot.ReadyState () == this.#m_pRNRoot.eSTATE.RECOVERED)
         {
            this.ReadyState (this.eSTATE.READY);
            this.Emit ('onRP1Notification_Ready', this.#m_pRNRoot);
         }
      }
   }

   #Unload (bNotify)
   {
      this.#m_pLnG.Detach (this);
      this.ReadyState (this.eSTATE.NOTREADY);

      this.#m_twRPersonaIx = 0;

      if (this.#m_pRNRoot)
      {
         this.#m_pRNRoot.Detach (this);
         this.#m_pRNRoot = this.#m_pLnG.Model_Close (this.#m_pRNRoot);
      }
   }
}

MV.MVRP.Fabric.Package.FRIENDS = class extends MV.MVMF.PLUGIN.PACKAGE
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVIO',
         'Friends',

         {
            aService  : [
                           'MVIO/MVIO',
                        ],
            aModel    : [
                           'MVRP_Dev/Session_RP1',

                           'MVRP_Fabric/RFRoot',
                           'MVRP_Fabric/RFRoot_RFChat',
                           'MVRP_Fabric/RFRoot_RFGroup',
                           'MVRP_Fabric/RFRoot_RFTeleport',
                           'MVRP_Fabric/RFFriend',
                           'MVRP_Fabric/RFChat',
                           'MVRP_Fabric/RFChat_RFMember',
                           'MVRP_Fabric/RFChat_RFMessage',
                           'MVRP_Fabric/RFGroup',
                           'MVRP_Fabric/RFGroup_RFMember',
                           'MVRP_Fabric/RFMeeting',
                           'MVRP_Fabric/RFTeleport',
                           'MVRP_Fabric/RFTeleport_RFTarget',
                           'MVRP_Fabric/RFInvitation',
                        ],
            aSource   : [
                           'MVRP_Dev/MVIO:Session_RP1',

                           'MVRP_Fabric/MVIO:RFRoot',
                           'MVRP_Fabric/MVIO:RFRoot_RFChat',
                           'MVRP_Fabric/MVIO:RFRoot_RFGroup',
                           'MVRP_Fabric/MVIO:RFRoot_RFTeleport',
                           'MVRP_Fabric/MVIO:RFFriend',
                           'MVRP_Fabric/MVIO:RFChat',
                           'MVRP_Fabric/MVIO:RFChat_RFMember',
                           'MVRP_Fabric/MVIO:RFChat_RFMessage',
                           'MVRP_Fabric/MVIO:RFGroup',
                           'MVRP_Fabric/MVIO:RFGroup_RFMember',
                           'MVRP_Fabric/MVIO:RFMeeting',
                           'MVRP_Fabric/MVIO:RFTeleport',
                           'MVRP_Fabric/MVIO:RFTeleport_RFTarget',
                           'MVRP_Fabric/MVIO:RFInvitation',
                        ]
         }
      );
   }

}

MV.MVRP.Fabric.Package.FRIENDS.FACTORY = class extends MV.MVMF.PLUGIN.PACKAGE.FACTORY
{

   Reference (sNamespace)
   {
      return new MV.MVRP.Fabric.Package.FRIENDS.IREFERENCE (this.sID, sNamespace, this.pConfig);
   }
}

MV.MVRP.Fabric.Package.FRIENDS.IREFERENCE = class extends MV.MVMF.PLUGIN.PACKAGE.IREFERENCE
{

   Create (pParam)
   {
      return new MV.MVRP.Fabric.Package.FRIENDS (this, pParam);
   }
}

MV.MVRP.Fabric.Package.NOTIFICATION = class extends MV.MVMF.PLUGIN.PACKAGE
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVIO',
         'Notification',

         {
            aService  : [
                           'MVIO/MVIO',
                        ],
            aModel    : [
                           'MVRP_Dev/Session_RP1',

                           'MVRP_Fabric/RNRoot',
                           'MVRP_Fabric/RNNotification',
                           'MVRP_Fabric/RNRoot_RNNotification'
                        ],
            aSource   : [
                           'MVRP_Dev/MVIO:Session_RP1',

                           'MVRP_Fabric/MVIO:RNRoot',
                           'MVRP_Fabric/MVIO:RNNotification',
                           'MVRP_Fabric/MVIO:RNRoot_RNNotification'
                        ]
         }
      );
   }

}

MV.MVRP.Fabric.Package.NOTIFICATION.FACTORY = class extends MV.MVMF.PLUGIN.PACKAGE.FACTORY
{

   Reference (sNamespace)
   {
      return new MV.MVRP.Fabric.Package.NOTIFICATION.IREFERENCE (this.sID, sNamespace, this.pConfig);
   }
}

MV.MVRP.Fabric.Package.NOTIFICATION.IREFERENCE = class extends MV.MVMF.PLUGIN.PACKAGE.IREFERENCE
{

   Create (pParam)
   {
      return new MV.MVRP.Fabric.Package.NOTIFICATION (this, pParam);
   }
}

MV.MVRP.Fabric.Package.PERSONA_CACHE = class extends MV.MVMF.PLUGIN.PACKAGE
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVRest',
         'Persona_Cache',

         {
            aService  : [
                           'MVRest/MVRest',
                        ],
            aModel    : [
                           'MVRP_Dev/Session_RP1',

                           'MVRP_Fabric/RPersona_Cache',
                        ],
            aSource   : [
                           'MVRP_Dev/MVRest:Session_RP1',

                           'MVRP_Fabric/MVRest:RPersona_Cache',
                        ]
         }
      );
   }

}

MV.MVRP.Fabric.Package.PERSONA_CACHE.FACTORY = class extends MV.MVMF.PLUGIN.PACKAGE.FACTORY
{

   Reference (sNamespace)
   {
      return new MV.MVRP.Fabric.Package.PERSONA_CACHE.IREFERENCE (this.sID, sNamespace, this.pConfig);
   }
}

MV.MVRP.Fabric.Package.PERSONA_CACHE.IREFERENCE = class extends MV.MVMF.PLUGIN.PACKAGE.IREFERENCE
{

   Create (pParam)
   {
      return new MV.MVRP.Fabric.Package.PERSONA_CACHE (this, pParam);
   }
}

MV.MVRP.Fabric.Package.GLOBAL_REGISTRY = class extends MV.MVMF.PLUGIN.PACKAGE
{
   static factory ()
   {
      return new this.FACTORY
      (
         'MVRest',
         'Global_Registry',

         {
            aService  : [
                           'MVRest/MVRest',
                        ],
            aModel    : [
                           'MVRP_Dev/Session_RP1',

                           'MVRP_Fabric/RGlobalRegistry',
                        ],
            aSource   : [
                           'MVRP_Dev/MVRest:Session_RP1',

                           'MVRP_Fabric/MVRest:RGlobalRegistry',
                        ]
         }
      );
   }

}

MV.MVRP.Fabric.Package.GLOBAL_REGISTRY.FACTORY = class extends MV.MVMF.PLUGIN.PACKAGE.FACTORY
{

   Reference (sNamespace)
   {
      return new MV.MVRP.Fabric.Package.GLOBAL_REGISTRY.IREFERENCE (this.sID, sNamespace, this.pConfig);
   }
}

MV.MVRP.Fabric.Package.GLOBAL_REGISTRY.IREFERENCE = class extends MV.MVMF.PLUGIN.PACKAGE.IREFERENCE
{

   Create (pParam)
   {
      return new MV.MVRP.Fabric.Package.GLOBAL_REGISTRY (this, pParam);
   }
}

MV.MVRP.Fabric.Install = function (pCore, pPlugin)
{
   let bResult = true;
   let pPackage;

   if (this.pRequire = pCore.Require ('MVRP_Dev'))
   {
      this.apFactory_Model =
      [
         MV.MVRP.Fabric.RFROOT                     .factory (),
         MV.MVRP.Fabric.RFROOT_RFCHAT              .factory (),
         MV.MVRP.Fabric.RFROOT_RFGROUP             .factory (),
         MV.MVRP.Fabric.RFROOT_RFTELEPORT          .factory (),
         MV.MVRP.Fabric.RFFRIEND                   .factory (),
         MV.MVRP.Fabric.RFCHAT                     .factory (),
         MV.MVRP.Fabric.RFCHAT_RFMEMBER            .factory (),
         MV.MVRP.Fabric.RFCHAT_RFMESSAGE           .factory (),
         MV.MVRP.Fabric.RFGROUP                    .factory (),
         MV.MVRP.Fabric.RFGROUP_RFMEMBER           .factory (),
         MV.MVRP.Fabric.RFMEETING                  .factory (),
         MV.MVRP.Fabric.RFTELEPORT                 .factory (),
         MV.MVRP.Fabric.RFTELEPORT_RFTARGET        .factory (),
         MV.MVRP.Fabric.RFINVITATION               .factory (),

         MV.MVRP.Fabric.RPERSONA_CACHE             .factory (),

         MV.MVRP.Fabric.RGLOBALREGISTRY            .factory (),

         MV.MVRP.Fabric.RNROOT                     .factory (),
         MV.MVRP.Fabric.RNNOTIFICATION             .factory (),
         MV.MVRP.Fabric.RNROOT_RNNOTIFICATION      .factory (),
      ];

      this.apFactory_Source =
      [
         MV.MVRP.Fabric.IO_RFROOT                  .factory (),
         MV.MVRP.Fabric.IO_RFROOT_RFCHAT           .factory (),
         MV.MVRP.Fabric.IO_RFROOT_RFGROUP          .factory (),
         MV.MVRP.Fabric.IO_RFROOT_RFTELEPORT       .factory (),
         MV.MVRP.Fabric.IO_RFFRIEND                .factory (),
         MV.MVRP.Fabric.IO_RFCHAT                  .factory (),
         MV.MVRP.Fabric.IO_RFCHAT_RFMEMBER         .factory (),
         MV.MVRP.Fabric.IO_RFCHAT_RFMESSAGE        .factory (),
         MV.MVRP.Fabric.IO_RFGROUP                 .factory (),
         MV.MVRP.Fabric.IO_RFGROUP_RFMEMBER        .factory (),
         MV.MVRP.Fabric.IO_RFTELEPORT              .factory (),
         MV.MVRP.Fabric.IO_RFTELEPORT_RFTARGET     .factory (),
         MV.MVRP.Fabric.IO_RFMEETING               .factory (),
         MV.MVRP.Fabric.IO_RFINVITATION            .factory (),

         MV.MVRP.Fabric.REST_RPERSONA_CACHE        .factory (),

         MV.MVRP.Fabric.REST_RGLOBALREGISTRY       .factory (),

         MV.MVRP.Fabric.IO_RNROOT                  .factory (),
         MV.MVRP.Fabric.IO_RNNOTIFICATION          .factory (),
         MV.MVRP.Fabric.IO_RNROOT_RNNOTIFICATION   .factory (),
      ];

      this.apFactory_Package =
      [
         MV.MVRP.Fabric.Package.FRIENDS            .factory (),
         MV.MVRP.Fabric.Package.NOTIFICATION       .factory (),
         MV.MVRP.Fabric.Package.PERSONA_CACHE      .factory (),
         MV.MVRP.Fabric.Package.GLOBAL_REGISTRY    .factory ()
      ];

      pPlugin.Factory_Models   (this.apFactory_Model);
      pPlugin.Factory_Sources  (this.apFactory_Source);
      pPlugin.Factory_Packages (this.apFactory_Package);
   }
   else bResult = false;

   return bResult;
}

MV.MVRP.Fabric.Unstall = function (pCore, pPlugin)
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

