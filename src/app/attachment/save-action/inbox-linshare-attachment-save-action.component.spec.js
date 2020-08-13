'use strict';

/* global chai: false */
/* global sinon: false */

let expect = chai.expect;

describe('The inboxLinshareAttachmentSaveAction component', function() {
  let $rootScope, $compile, $q;
  let inboxLinshareAttachmentSaveActionService, linshareApiClient;
  let scope, attachmentMock, configMock;

  beforeEach(function() {
    module('esn.configuration', function($provide) {
      $provide.constant('esnConfig', function() {
        return $q.when(configMock);
      });
    });
  });

  beforeEach(function() {
    module('jadeTemplates');
    module('linagora.esn.unifiedinbox.linshare');

    inject(function(
      _$compile_,
      _$rootScope_,
      _$q_,
      _linshareApiClient_,
      _inboxLinshareAttachmentSaveActionService_
    ) {
      $rootScope = _$rootScope_;
      $compile = _$compile_;
      $q = _$q_;
      inboxLinshareAttachmentSaveActionService = _inboxLinshareAttachmentSaveActionService_;
      linshareApiClient = _linshareApiClient_;

      inboxLinshareAttachmentSaveActionService.getAttachmentMapping = sinon.stub();
      inboxLinshareAttachmentSaveActionService.watch = sinon.stub();
      inboxLinshareAttachmentSaveActionService.saveAttachmentToLinshare = sinon.stub();
      linshareApiClient.getDocument = sinon.stub();
    });

    attachmentMock = {};
  });

  function initComponent() {
    scope = $rootScope.$new();

    scope.attachment = attachmentMock;

    let element = $compile('<inbox-linshare-attachment-save-action attachment="attachment" />')(scope);

    scope.$digest();

    return element;
  }

  it('should show Checking label while getting attachment mapping', function() {
    inboxLinshareAttachmentSaveActionService.getAttachmentMapping.returns($q.defer().promise);

    let element = initComponent();

    expect(element.find('span.label').text()).to.equal('Checking...');
  });

  it('should show Save label when attachment mapping is not found', function() {
    inboxLinshareAttachmentSaveActionService.getAttachmentMapping.returns($q.when());

    let element = initComponent();

    expect(element.find('span.label').text()).to.equal('Save');
  });

  it('should show Save label if the attachment saved once but then removed from Linshare', function() {
    linshareApiClient.getDocument.returns($q.reject());
    inboxLinshareAttachmentSaveActionService.getAttachmentMapping.returns($q.when({ documentId: '123' }));

    let element = initComponent();

    expect(element.find('span.label').text()).to.equal('Save');
  });

  it('should show Save label when it fails to get mapping', function() {
    inboxLinshareAttachmentSaveActionService.getAttachmentMapping.returns($q.reject());

    let element = initComponent();

    expect(element.find('span.label').text()).to.equal('Save');
  });

  it('should show Saved label when attachment is saved to LinShare', function() {
    linshareApiClient.getDocument.returns($q.when({ documentId: '1234' }));
    inboxLinshareAttachmentSaveActionService.getAttachmentMapping.returns($q.when({
      documentId: '1234'
    }));

    let element = initComponent();

    expect(element.find('span.label').text()).to.equal('Saved');
  });

  it('should show Saving label and watch the mapping when attachment is being saved to LinShare', function() {
    let mapping = { asyncTaskId: '123' };

    inboxLinshareAttachmentSaveActionService.getAttachmentMapping.returns($q.when(mapping));
    inboxLinshareAttachmentSaveActionService.watch.returns($q.defer().promise);

    let element = initComponent();

    expect(element.find('span.label').text()).to.equal('Saving...');
    expect(inboxLinshareAttachmentSaveActionService.watch).to.have.been.calledWith(mapping);
  });

  it('should show Saved label when mapping watcher is resolved', function() {
    let mapping = { asyncTaskId: '123' };

    inboxLinshareAttachmentSaveActionService.getAttachmentMapping.returns($q.when(mapping));
    inboxLinshareAttachmentSaveActionService.watch.returns($q.when());

    let element = initComponent();

    expect(element.find('span.label').text()).to.equal('Saved');
  });

  it('should show Saved button with the link to open file in LinShare when mapping watcher is resolved', function() {
    configMock = 'http://linshare.org';
    let mapping = { asyncTaskId: '123', documentId: '456' };
    let expectUrl = configMock + '#/files/list?fileUuid=' + mapping.documentId;

    linshareApiClient.getDocument.returns($q.when({ documentId: '456' }));
    inboxLinshareAttachmentSaveActionService.getAttachmentMapping.returns($q.when(mapping));
    inboxLinshareAttachmentSaveActionService.watch.returns($q.when());

    let element = initComponent();

    expect(element.find('a').attr('target')).to.equal('_blank');
    expect(element.find('a').attr('href')).to.equal(expectUrl);
    expect(element.find('span.label').text()).to.equal('Saved');
  });

  it('should show Save label when mapping watcher is rejected', function() {
    let mapping = { asyncTaskId: '123' };

    inboxLinshareAttachmentSaveActionService.getAttachmentMapping.returns($q.when(mapping));
    inboxLinshareAttachmentSaveActionService.watch.returns($q.reject());

    let element = initComponent();

    expect(element.find('span.label').text()).to.equal('Save');
  });

  describe('when click on', function() {
    beforeEach(function() {
      inboxLinshareAttachmentSaveActionService.getAttachmentMapping.returns($q.when());
    });

    it('should save attachment to LinShare mark label as Saving while waiting', function() {
      inboxLinshareAttachmentSaveActionService.saveAttachmentToLinshare.returns($q.defer().promise);

      let element = initComponent();

      element.find('a').click();

      expect(element.find('span.label').text()).to.equal('Saving...');
      expect(inboxLinshareAttachmentSaveActionService.saveAttachmentToLinshare).to.have.been.calledWith(attachmentMock);
    });

    it('should show Save label again when it fails to save attachment (error occurs)', function() {
      inboxLinshareAttachmentSaveActionService.saveAttachmentToLinshare.returns($q.reject());

      let element = initComponent();

      element.find('a').click();

      expect(element.find('span.label').text()).to.equal('Save');
    });

    it('should show Save label again when it fails to save attachment (no mapping created)', function() {
      inboxLinshareAttachmentSaveActionService.saveAttachmentToLinshare.returns($q.when());

      let element = initComponent();

      element.find('a').click();

      expect(element.find('span.label').text()).to.equal('Save');
    });

    it('should show Saved label when attachment is saved to LinShare immediately', function() {
      let mapping = { documentId: '123' };

      linshareApiClient.getDocument.returns($q.when({ documentId: '123' }));
      inboxLinshareAttachmentSaveActionService.saveAttachmentToLinshare.returns($q.when(mapping));

      let element = initComponent();

      element.find('a').click();

      expect(element.find('span.label').text()).to.equal('Saved');
    });

    it('should show Saving label and watch the mapping while attachment is being saved', function() {
      let mapping = { asyncTaskId: '123' };

      inboxLinshareAttachmentSaveActionService.saveAttachmentToLinshare.returns($q.when(mapping));
      inboxLinshareAttachmentSaveActionService.watch.returns($q.defer().promise);

      let element = initComponent();

      element.find('a').click();

      expect(element.find('span.label').text()).to.equal('Saving...');
      expect(inboxLinshareAttachmentSaveActionService.watch).to.have.been.calledWith(mapping);
    });

    it('should show Saved label and when watcher is resolved', function() {
      let mapping = { asyncTaskId: '123' };

      inboxLinshareAttachmentSaveActionService.saveAttachmentToLinshare.returns($q.when(mapping));
      inboxLinshareAttachmentSaveActionService.watch.returns($q.when());

      let element = initComponent();

      element.find('a').click();

      expect(element.find('span.label').text()).to.equal('Saved');
    });

    it('should show Saved button with the link to open file in LinShare when mapping watcher is resolved', function() {
      configMock = 'http://linshare.org';
      let documentId = '456';
      let mapping = { asyncTaskId: '123' };
      let expectUrl = configMock + '#/files/list?fileUuid=' + documentId;

      inboxLinshareAttachmentSaveActionService.saveAttachmentToLinshare.returns($q.when(mapping));
      inboxLinshareAttachmentSaveActionService.watch = function() {
        return $q.when(documentId);
      };

      let element = initComponent();

      element.find('a').click();

      expect(element.find('a').attr('target')).to.equal('_blank');
      expect(element.find('a').attr('href')).to.equal(expectUrl);
      expect(element.find('span.label').text()).to.equal('Saved');
    });

    it('should show Save label and when watcher is reject', function() {
      let mapping = { asyncTaskId: '123' };

      inboxLinshareAttachmentSaveActionService.saveAttachmentToLinshare.returns($q.when(mapping));
      inboxLinshareAttachmentSaveActionService.watch.returns($q.reject());

      let element = initComponent();

      element.find('a').click();

      expect(element.find('span.label').text()).to.equal('Save');
    });
  });
});
