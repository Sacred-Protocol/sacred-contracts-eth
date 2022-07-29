// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

library Pairing {
    uint256 constant PRIME_Q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    struct G1Point {
        uint256 X;
        uint256 Y;
    }

    // Encoding of field elements is: X[0] * z + X[1]
    struct G2Point {
        uint256[2] X;
        uint256[2] Y;
    }

    /*
     * @return The negation of p, i.e. p.plus(p.negate()) should be zero
     */
    function negate(G1Point memory p) internal pure returns (G1Point memory) {
        // The prime q in the base field F_q for G1
        if (p.X == 0 && p.Y == 0) {
            return G1Point(0, 0);
        } else {
            return G1Point(p.X, PRIME_Q - (p.Y % PRIME_Q));
        }
    }

    /*
     * @return r the sum of two points of G1
     */
    function plus(
        G1Point memory p1,
        G1Point memory p2
    ) internal view returns (G1Point memory r) {
        uint256[4] memory input = [
            p1.X, p1.Y,
            p2.X, p2.Y
        ];
        bool success;

        // solium-disable-next-line security/no-inline-assembly
        assembly {
            success := staticcall(sub(gas(), 2000), 6, input, 0xc0, r, 0x60)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }

        require(success, "pairing-add-failed");
    }

    /*
     * @return r the product of a point on G1 and a scalar, i.e.
     *         p == p.scalarMul(1) and p.plus(p) == p.scalarMul(2) for all
     *         points p.
     */
    function scalarMul(G1Point memory p, uint256 s) internal view returns (G1Point memory r) {
        uint256[3] memory input = [p.X, p.Y, s];
        bool success;

        // solium-disable-next-line security/no-inline-assembly
        assembly {
            success := staticcall(sub(gas(), 2000), 7, input, 0x80, r, 0x60)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }

        require(success, "pairing-mul-failed");
    }

    /* @return The result of computing the pairing check
     *         e(p1[0], p2[0]) *  .... * e(p1[n], p2[n]) == 1
     *         For example,
     *         pairing([P1(), P1().negate()], [P2(), P2()]) should return true.
     */
    function pairing(
        G1Point memory a1,
        G2Point memory a2,
        G1Point memory b1,
        G2Point memory b2,
        G1Point memory c1,
        G2Point memory c2,
        G1Point memory d1,
        G2Point memory d2
    ) internal view returns (bool) {
        uint256[24] memory input = [
            a1.X, a1.Y, a2.X[0], a2.X[1], a2.Y[0], a2.Y[1],
            b1.X, b1.Y, b2.X[0], b2.X[1], b2.Y[0], b2.Y[1],
            c1.X, c1.Y, c2.X[0], c2.X[1], c2.Y[0], c2.Y[1],
            d1.X, d1.Y, d2.X[0], d2.X[1], d2.Y[0], d2.Y[1]
        ];
        uint256[1] memory out;
        bool success;

        // solium-disable-next-line security/no-inline-assembly
        assembly {
            success := staticcall(sub(gas(), 2000), 8, input, mul(24, 0x20), out, 0x20)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }

        require(success, "pairing-opcode-failed");
        return out[0] != 0;
    }
}

contract Verifier {
    uint256 constant SNARK_SCALAR_FIELD = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    uint256 constant PRIME_Q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;
    using Pairing for *;

    struct VerifyingKey {
        Pairing.G1Point alfa1;
        Pairing.G2Point beta2;
        Pairing.G2Point gamma2;
        Pairing.G2Point delta2;
        Pairing.G1Point[7] IC;
    }

    function verifyingKey() internal pure returns (VerifyingKey memory vk) {
        vk.alfa1 = Pairing.G1Point(uint256(2716894789766860705480572884882327526272063118273905481829175777148901691147), uint256(20016447410483166612266960252935361813714256564414892628087341330522790124810));
        vk.beta2 = Pairing.G2Point([uint256(12567836386270923228486247518702590557040361451608923744881470382218031804886), uint256(1748514736653164701983851759173770138133823205513353468366220329373461698915)], [uint256(13269980721619281266903816012300444941991930185938630084015366067182447113623), uint256(1834809592841059405278305596841315232986118611096606326082156528184832722804)]);
        vk.gamma2 = Pairing.G2Point([uint256(20847594279349311191146772616701905286381119559674308950926661652008716159438), uint256(3730675332352650420414606611132380815992714607847930130167526444202416110090)], [uint256(13767278491054261791304651741228170640855028408095879212804692055918436015783), uint256(14092293549396327020376820007919666163827372453664343035225237454858790406248)]);
        vk.delta2 = Pairing.G2Point([uint256(4756987968857785630897921354545664436568762945816099581258503347476896612310), uint256(4194628836529550404099720617978926989806366456658385088037797524230988606176)], [uint256(8784053917622543010028964808936782974335449326009225897108868949849645672158), uint256(11698968986383822975066216413396782493134967347350832042400230438282097288257)]);
        vk.IC[0] = Pairing.G1Point(uint256(14100369735059767803679748418345854294209882690098460157004418443935822778215), uint256(15099973429503551806081922905954162228179255542246893007813511025336555197045));
        vk.IC[1] = Pairing.G1Point(uint256(16550095487700438675080637606031781149993007443904218123904693371876731351709), uint256(10847365755001615928631150237631787042357473604968016110708571053610448654887));
        vk.IC[2] = Pairing.G1Point(uint256(17297298099889221789066515873675595243406300536031099349748349434565465895769), uint256(20804746862711591831925348252431989025553817808352684688886953900768182880650));
        vk.IC[3] = Pairing.G1Point(uint256(19541437049444264654461479682530323058044882857912571799678847904759757470054), uint256(7488793752010650206016075121359369249582501901345628849820136842362786597707));
        vk.IC[4] = Pairing.G1Point(uint256(20284356839878887748570591582156585531660103512280935115506928094121622855108), uint256(393523518660990912548820383661226011369184513838017090087371113759969097244));
        vk.IC[5] = Pairing.G1Point(uint256(5505734420126423876426876590968916939396746019511709785214062095338198645374), uint256(11264408126063607739547308160151837939814991083501878917464778119186507207159));
        vk.IC[6] = Pairing.G1Point(uint256(15652768789631477045740995877587608228337567249898304650946018710750058039826), uint256(18252134236204641863939970570255514322669252462067784015422352196620876695675));

    }

    /*
     * @returns Whether the proof is valid given the hardcoded verifying key
     *          above and the public inputs
     */
    function verifyProof(
        bytes memory proof,
        uint256[6] memory input
    ) public view returns (bool) {
        uint256[8] memory p = abi.decode(proof, (uint256[8]));
        for (uint8 i = 0; i < p.length; i++) {
            // Make sure that each element in the proof is less than the prime q
            require(p[i] < PRIME_Q, "verifier-proof-element-gte-prime-q");
        }
        Pairing.G1Point memory proofA = Pairing.G1Point(p[0], p[1]);
        Pairing.G2Point memory proofB = Pairing.G2Point([p[2], p[3]], [p[4], p[5]]);
        Pairing.G1Point memory proofC = Pairing.G1Point(p[6], p[7]);

        VerifyingKey memory vk = verifyingKey();
        // Compute the linear combination vkX
        Pairing.G1Point memory vkX = vk.IC[0];
        for (uint256 i = 0; i < input.length; i++) {
            // Make sure that every input is less than the snark scalar field
            require(input[i] < SNARK_SCALAR_FIELD, "verifier-input-gte-snark-scalar-field");
            vkX = Pairing.plus(vkX, Pairing.scalarMul(vk.IC[i + 1], input[i]));
        }

        return Pairing.pairing(
            Pairing.negate(proofA),
            proofB,
            vk.alfa1,
            vk.beta2,
            vkX,
            vk.gamma2,
            proofC,
            vk.delta2
        );
    }
}

