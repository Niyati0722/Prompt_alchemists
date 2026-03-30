// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ReportStorage {
    // Maps each address to their list of stored reports
    mapping(address => string[]) private reports;

    // Emitted every time a report is saved
    event ReportStored(address indexed user, uint256 index, uint256 timestamp);

    /**
     * @notice Store a JSON report string on-chain.
     * @param data  The full JSON string (walls + materials + AI explanation).
     */
    function storeReport(string memory data) public {
        reports[msg.sender].push(data);
        emit ReportStored(msg.sender, reports[msg.sender].length - 1, block.timestamp);
    }

    /**
     * @notice Retrieve all reports saved by the caller.
     */
    function getMyReports() public view returns (string[] memory) {
        return reports[msg.sender];
    }

    /**
     * @notice How many reports the caller has saved.
     */
    function getMyReportCount() public view returns (uint256) {
        return reports[msg.sender].length;
    }
}
