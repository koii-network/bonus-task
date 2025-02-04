// testAudits.js
const { expect } = require("chai");
const sinon = require("sinon");
const { namespaceWrapper } = require("@_koii/namespace-wrapper");
const { audit } = require("../src/task/3-audit.js");
const { getDataFromCID } = require("../src/modules/getDataFromCID.js");
const {
  calculateRewards,
  checkSumTally,
} = require("../src/modules/helpers.js");

// Mocks for external modules
describe("audit function", function () {
  let getDataFromCIDStub,
    namespaceWrapperGetTaskStateStub,
    namespaceWrapperGetSlotStub;
  let calculateRewardsStub, checkSumTallyStub;

  const mockSubmission = "some-cid";
  const mockRoundNumber = 1;
  const mockSubmitterKey = "submitter-key";
  const mockData = {
    user_vote: {
      vote: { task1: { type: "type1" }, task2: { type: "type2" } },
      getStakingKeys: {
        getKoiiStakingKey: "koii-key",
        getKPLStakingKey: "kpl-key",
      },
    },
  };

  beforeEach(function () {
    // Create stubs before each test
    getDataFromCIDStub = sinon.stub(getDataFromCID, "default");
    namespaceWrapperGetTaskStateStub = sinon.stub(
      namespaceWrapper,
      "getTaskState",
    );
    namespaceWrapperGetSlotStub = sinon.stub(namespaceWrapper, "getSlot");
    calculateRewardsStub = sinon.stub(calculateRewards);
    checkSumTallyStub = sinon.stub(checkSumTally);
  });

  afterEach(function () {
    // Restore the original functions after each test
    sinon.restore();
  });

  it("should return false if getDataFromCID fails to fetch valid data", async function () {
    // Simulate a failed fetch from getDataFromCID
    getDataFromCIDStub.resolves(null);

    const result = await audit(
      mockSubmission,
      mockRoundNumber,
      mockSubmitterKey,
    );
    expect(result).to.equal(false);
  });

  it("should return false if the user_vote object is empty", async function () {
    // Simulate a valid getDataFromCID, but with an empty vote object
    getDataFromCIDStub.resolves({
      user_vote: {
        vote: {},
        getStakingKeys: {
          getKoiiStakingKey: "koii-key",
          getKPLStakingKey: "kpl-key",
        },
      },
    });

    const result = await audit(
      mockSubmission,
      mockRoundNumber,
      mockSubmitterKey,
    );
    expect(result).to.equal(false);
  });

  it("should return false if task state is outside the time window", async function () {
    // Simulate a valid getDataFromCID, but task state is out of the time window
    getDataFromCIDStub.resolves(mockData);
    namespaceWrapperGetTaskStateStub.resolves({
      starting_slot: 1000,
      round_time: 600,
    });
    namespaceWrapperGetSlotStub.resolves(2000); // Current slot is too late

    const result = await audit(
      mockSubmission,
      mockRoundNumber,
      mockSubmitterKey,
    );
    expect(result).to.equal(false);
  });

  it("should return true if audit process completes successfully", async function () {
    // Simulate a valid scenario
    getDataFromCIDStub.resolves(mockData);
    namespaceWrapperGetTaskStateStub.resolves({
      starting_slot: 1000,
      round_time: 600,
    });
    namespaceWrapperGetSlotStub.resolves(1500); // Slot is within the time window
    calculateRewardsStub.resolves({ "koii-key": 1000, "kpl-key": 500 });
    checkSumTallyStub.resolves(true); // Simulate correct checksum tally

    const result = await audit(
      mockSubmission,
      mockRoundNumber,
      mockSubmitterKey,
    );
    expect(result).to.equal(true);
  });

  it("should return false if an error occurs during the audit process", async function () {
    // Simulate an error during task state fetch
    getDataFromCIDStub.resolves(mockData);
    namespaceWrapperGetTaskStateStub.rejects(
      new Error("Task state fetch error"),
    );

    const result = await audit(
      mockSubmission,
      mockRoundNumber,
      mockSubmitterKey,
    );
    expect(result).to.equal(false);
  });
});
